from fastapi import APIRouter
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import yfinance as yf
import os
from fredapi import Fred
import pytz
import pandas as pd

router = APIRouter()

class MacroIndicator(BaseModel):
    name: str
    value: float
    unit: str
    change: Optional[float] = None
    timestamp: datetime

# FRED API 초기화
FRED_API_KEY = os.getenv("FRED_API_KEY")
fred = Fred(api_key=FRED_API_KEY) if FRED_API_KEY else None

# 캐시 저장소
_macro_cache: Dict[str, any] = {
    "data": {},
    "last_update": None,
    "updating": False
}

def get_california_time():
    """캘리포니아 시간대 현재 시간"""
    pacific = pytz.timezone('America/Los_Angeles')
    return datetime.now(pacific)

def should_update_cache():
    """캐시를 업데이트해야 하는지 확인 (미국 장 개장 시간 기준)"""
    if not _macro_cache["last_update"]:
        return True
    
    now = get_california_time()
    last_update = _macro_cache["last_update"]
    
    # 마지막 업데이트가 오늘 아니면 업데이트
    if last_update.date() != now.date():
        # 장 개장 시간(06:30 PST) 이후인지 확인
        market_open = now.replace(hour=6, minute=30, second=0, microsecond=0)
        if now >= market_open:
            return True
    
    return False

def get_fear_greed_index():
    """Fear & Greed Index 가져오기 (Alternative.me API 사용)"""
    try:
        import requests
        response = requests.get("https://api.alternative.me/fng/?limit=2", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if "data" in data and len(data["data"]) > 0:
                current = int(data["data"][0]["value"])
                classification = data["data"][0]["value_classification"]
                return {
                    "value": current,
                    "classification": classification,
                    "timestamp": datetime.fromtimestamp(int(data["data"][0]["timestamp"]))
                }
    except Exception as e:
        print(f"Fear & Greed API 에러: {e}")
    
    # Fallback: VIX 기반 추정
    try:
        vix = get_vix_index()
        fear_greed_value = min(100, max(0, int(100 - (vix["value"] * 2))))
        if fear_greed_value > 75:
            classification = "Extreme Greed"
        elif fear_greed_value > 55:
            classification = "Greed"
        elif fear_greed_value > 45:
            classification = "Neutral"
        elif fear_greed_value > 25:
            classification = "Fear"
        else:
            classification = "Extreme Fear"
        return {
            "value": fear_greed_value,
            "classification": classification,
            "timestamp": datetime.now()
        }
    except:
        pass
    
    return {"value": 50, "classification": "Neutral", "timestamp": datetime.now()}

def get_vix_index():
    """VIX 지수 가져오기"""
    try:
        vix = yf.Ticker("^VIX")
        hist = vix.history(period="5d")
        if not hist.empty:
            current = round(hist['Close'].iloc[-1], 2)
            prev = round(hist['Close'].iloc[-2], 2) if len(hist) > 1 else current
            change = round(current - prev, 2)
            
            if current < 15:
                status = "Low"
            elif current < 25:
                status = "Medium"
            else:
                status = "High"
            
            return {
                "value": current,
                "change": change,
                "status": status
            }
    except:
        pass
    return {"value": 13.8, "change": 0, "status": "Low"}

def get_m2_money_supply():
    """M2 통화량 가져오기"""
    try:
        if fred:
            from datetime import datetime, timedelta
            # 최근 6개월 데이터 가져오기
            start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
            m2_data = fred.get_series('M2SL', observation_start=start_date)
            if len(m2_data) > 0:
                current = round(m2_data.iloc[-1] / 1000, 2)  # Billions to Trillions
                prev = round(m2_data.iloc[-2] / 1000, 2) if len(m2_data) > 1 else current
                change = round(current - prev, 2)
                return {"value": current, "change": change}
    except Exception as e:
        print(f"M2 에러: {e}")
    return {"value": 21.2, "change": 0.1}

def get_fed_funds_rate():
    """연준 기준금리 가져오기"""
    try:
        if fred:
            from datetime import datetime, timedelta
            # 최근 6개월 데이터 가져오기
            start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
            rate_data = fred.get_series('FEDFUNDS', observation_start=start_date)
            if len(rate_data) > 0:
                current = round(rate_data.iloc[-1], 2)
                prev = round(rate_data.iloc[-2], 2) if len(rate_data) > 1 else current
                change = round(current - prev, 2)
                return {"value": current, "change": change}
    except Exception as e:
        print(f"Fed Rate 에러: {e}")
    return {"value": 5.5, "change": 0}

def update_macro_cache():
    """매크로 지표 캐시 업데이트"""
    global _macro_cache
    
    if _macro_cache["updating"]:
        print("⏳ 이미 업데이트 중입니다.")
        return
    
    _macro_cache["updating"] = True
    print("🔄 매크로 지표 캐시 업데이트 시작...")
    
    try:
        vix = get_vix_index()
        m2 = get_m2_money_supply()
        fed_rate = get_fed_funds_rate()
        fear_greed = get_fear_greed_index()
        
        _macro_cache["data"] = {
            "fear_greed": fear_greed,
            "m2": m2,
            "fed_funds_rate": fed_rate,
            "vix": vix
        }
        _macro_cache["last_update"] = get_california_time()
        print(f"✅ 매크로 지표 캐시 업데이트 완료: {_macro_cache['last_update'].strftime('%Y-%m-%d %H:%M:%S %Z')}")
    except Exception as e:
        print(f"❌ 매크로 지표 캐시 업데이트 실패: {e}")
    finally:
        _macro_cache["updating"] = False

def get_cached_macro_data():
    """캐시된 매크로 데이터 가져오기 (하루 1회 자동 갱신)"""
    if should_update_cache() and not _macro_cache["updating"]:
        from threading import Thread
        Thread(target=update_macro_cache, daemon=True).start()
    
    # 캐시가 비어있으면 동기적으로 업데이트
    if not _macro_cache["data"]:
        update_macro_cache()
    
    return _macro_cache["data"], _macro_cache["last_update"]

@router.get("/overview")
async def get_macro_overview():
    """
    매크로 지표 개요
    
    - 하루 1회 자동 갱신 (미국 장 개장 시간: 06:30 PST)
    - 마지막 업데이트 시간 포함
    """
    cached_data, last_update = get_cached_macro_data()
    
    # 캐시가 없으면 즉시 가져오기
    if not cached_data:
        vix = get_vix_index()
        m2 = get_m2_money_supply()
        fed_rate = get_fed_funds_rate()
        fear_greed = get_fear_greed_index()
        last_update = get_california_time()
    else:
        fear_greed = cached_data.get("fear_greed", {})
        m2 = cached_data.get("m2", {})
        fed_rate = cached_data.get("fed_funds_rate", {})
        vix = cached_data.get("vix", {})
    
    return {
        "indicators": {
            "fear_greed": {
                "name": "Fear & Greed Index",
                "value": fear_greed.get("value", 50),
                "label": fear_greed.get("classification", "Neutral"),
                "timestamp": fear_greed.get("timestamp", datetime.now())
            },
            "m2": {
                "name": "M2 Money Supply",
                "value": m2.get("value", 21.2),
                "change": m2.get("change", 0),
                "unit": "Trillion USD",
                "timestamp": datetime.now()
            },
            "fed_funds_rate": {
                "name": "Federal Funds Rate",
                "value": fed_rate.get("value", 5.5),
                "change": fed_rate.get("change", 0),
                "unit": "Percent",
                "timestamp": datetime.now()
            },
            "vix": {
                "name": "VIX Index",
                "value": vix.get("value", 13.8),
                "change": vix.get("change", 0),
                "status": vix.get("status", "Low"),
                "timestamp": datetime.now()
            }
        },
        "last_update": last_update.isoformat() if last_update else None,
        "next_update": "매일 06:30 PST (미국 장 개장 시간)"
    }

@router.get("/fear-greed")
async def get_fear_greed_endpoint():
    """Fear & Greed Index (실시간 API)"""
    return get_fear_greed_index()

@router.get("/interest-rates")
async def get_interest_rates():
    """금리 정보 (FRED API 실시간 데이터)"""
    fed_rate = get_fed_funds_rate()
    
    # 국채 수익률 가져오기
    treasury_10y = {"value": 4.35, "unit": "percent"}
    treasury_2y = {"value": 4.82, "unit": "percent"}
    
    try:
        if fred:
            from datetime import timedelta
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            
            # 10년물 국채
            dgs10 = fred.get_series('DGS10', observation_start=start_date)
            if len(dgs10) > 0:
                treasury_10y = {
                    "value": round(dgs10.iloc[-1], 2),
                    "unit": "percent"
                }
            
            # 2년물 국채
            dgs2 = fred.get_series('DGS2', observation_start=start_date)
            if len(dgs2) > 0:
                treasury_2y = {
                    "value": round(dgs2.iloc[-1], 2),
                    "unit": "percent"
                }
    except Exception as e:
        print(f"Treasury rates 에러: {e}")
    
    return {
        "fed_funds_rate": {
            "value": fed_rate["value"],
            "unit": "percent"
        },
        "treasury_10y": treasury_10y,
        "treasury_2y": treasury_2y
    }

@router.get("/exchange-rates")
async def get_exchange_rates():
    """환율 정보 (실시간 yfinance 데이터)"""
    usd_krw = {"value": 1308.50, "change": 0}
    dxy = {"value": 104.25, "change": 0}
    
    try:
        # USD/KRW
        krw_ticker = yf.Ticker("KRW=X")
        krw_hist = krw_ticker.history(period="5d")
        if not krw_hist.empty:
            current_krw = round(krw_hist['Close'].iloc[-1], 2)
            prev_krw = round(krw_hist['Close'].iloc[-2], 2) if len(krw_hist) > 1 else current_krw
            usd_krw = {
                "value": current_krw,
                "change": round(current_krw - prev_krw, 2)
            }
        
        # DXY (Dollar Index)
        dxy_ticker = yf.Ticker("DX-Y.NYB")
        dxy_hist = dxy_ticker.history(period="5d")
        if not dxy_hist.empty:
            current_dxy = round(dxy_hist['Close'].iloc[-1], 2)
            prev_dxy = round(dxy_hist['Close'].iloc[-2], 2) if len(dxy_hist) > 1 else current_dxy
            dxy = {
                "value": current_dxy,
                "change": round(current_dxy - prev_dxy, 2)
            }
    except Exception as e:
        print(f"환율 에러: {e}")
    
    return {
        "usd_krw": usd_krw,
        "dxy": dxy
    }

@router.get("/history/fear-greed")
async def get_fear_greed_history(days: int = 30):
    """
    Fear & Greed Index 히스토리 (Alternative.me API)
    
    최근 N일간의 Fear & Greed Index 추이
    """
    try:
        import requests
        response = requests.get(f"https://api.alternative.me/fng/?limit={days}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "data" in data:
                history = []
                for item in reversed(data["data"]):
                    history.append({
                        "date": datetime.fromtimestamp(int(item["timestamp"])).strftime("%Y-%m-%d"),
                        "value": int(item["value"]),
                        "classification": item["value_classification"]
                    })
                return {"history": history, "days": len(history)}
    except Exception as e:
        print(f"Fear & Greed 히스토리 에러: {e}")
    
    # Fallback: 더미 데이터
    return {"history": [], "days": 0, "note": "데이터를 가져올 수 없습니다"}

@router.get("/history/interest-rates")
async def get_interest_rates_history(months: int = 12):
    """
    금리 히스토리 (FRED API)
    
    최근 N개월간의 연준 기준금리, 10년물, 2년물 국채 수익률
    """
    try:
        if not fred:
            return {"history": [], "months": 0, "note": "FRED API 키가 필요합니다"}
        
        start_date = (datetime.now() - timedelta(days=months * 30)).strftime('%Y-%m-%d')
        
        # 연준 기준금리
        fed_funds = fred.get_series('FEDFUNDS', observation_start=start_date)
        # 10년물 국채
        treasury_10y = fred.get_series('DGS10', observation_start=start_date)
        # 2년물 국채
        treasury_2y = fred.get_series('DGS2', observation_start=start_date)
        
        # 월별로 마지막 값 추출
        history = []
        for i in range(months):
            month_date = datetime.now() - timedelta(days=(months - i - 1) * 30)
            month_str = month_date.strftime('%Y-%m')
            
            # 해당 월의 데이터 필터링
            month_fed = fed_funds[fed_funds.index.strftime('%Y-%m') == month_str]
            month_10y = treasury_10y[treasury_10y.index.strftime('%Y-%m') == month_str]
            month_2y = treasury_2y[treasury_2y.index.strftime('%Y-%m') == month_str]
            
            if len(month_fed) > 0 or len(month_10y) > 0 or len(month_2y) > 0:
                history.append({
                    "date": month_date.strftime('%Y-%m'),
                    "fed_funds_rate": round(float(month_fed.iloc[-1]), 2) if len(month_fed) > 0 and not pd.isna(month_fed.iloc[-1]) else None,
                    "treasury_10y": round(float(month_10y.iloc[-1]), 2) if len(month_10y) > 0 and not pd.isna(month_10y.iloc[-1]) else None,
                    "treasury_2y": round(float(month_2y.iloc[-1]), 2) if len(month_2y) > 0 and not pd.isna(month_2y.iloc[-1]) else None
                })
        
        return {"history": history, "months": len(history)}
    except Exception as e:
        print(f"금리 히스토리 에러: {e}")
        return {"history": [], "months": 0, "note": f"데이터를 가져올 수 없습니다: {e}"}

@router.get("/history/vix")
async def get_vix_history(days: int = 30):
    """
    VIX 히스토리 (yfinance)
    
    최근 N일간의 VIX 지수 추이
    """
    try:
        vix = yf.Ticker("^VIX")
        hist = vix.history(period=f"{days}d")
        
        if not hist.empty:
            history = []
            for date, row in hist.iterrows():
                history.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "value": round(row['Close'], 2)
                })
            return {"history": history, "days": len(history)}
    except Exception as e:
        print(f"VIX 히스토리 에러: {e}")
    
    return {"history": [], "days": 0, "note": "데이터를 가져올 수 없습니다"}

@router.get("/history/exchange-rates")
async def get_exchange_rates_history(days: int = 30):
    """
    환율 히스토리 (yfinance)
    
    최근 N일간의 USD/KRW, DXY 추이
    """
    try:
        # USD/KRW
        krw_ticker = yf.Ticker("KRW=X")
        krw_hist = krw_ticker.history(period=f"{days}d")
        
        # DXY
        dxy_ticker = yf.Ticker("DX-Y.NYB")
        dxy_hist = dxy_ticker.history(period=f"{days}d")
        
        history = []
        
        # 날짜별로 데이터 결합
        dates = set(krw_hist.index.strftime("%Y-%m-%d")).union(set(dxy_hist.index.strftime("%Y-%m-%d")))
        
        for date_str in sorted(dates):
            krw_value = None
            dxy_value = None
            
            # KRW 데이터
            krw_date_data = krw_hist[krw_hist.index.strftime("%Y-%m-%d") == date_str]
            if len(krw_date_data) > 0:
                krw_value = round(krw_date_data['Close'].iloc[0], 2)
            
            # DXY 데이터
            dxy_date_data = dxy_hist[dxy_hist.index.strftime("%Y-%m-%d") == date_str]
            if len(dxy_date_data) > 0:
                dxy_value = round(dxy_date_data['Close'].iloc[0], 2)
            
            if krw_value or dxy_value:
                history.append({
                    "date": date_str,
                    "usd_krw": krw_value,
                    "dxy": dxy_value
                })
        
        return {"history": history, "days": len(history)}
    except Exception as e:
        print(f"환율 히스토리 에러: {e}")
    
    return {"history": [], "days": 0, "note": "데이터를 가져올 수 없습니다"}

@router.post("/refresh")
async def refresh_macro_cache():
    """
    매크로 지표 캐시 강제 새로고침
    
    백그라운드에서 모든 매크로 지표를 다시 수집합니다.
    """
    from threading import Thread
    Thread(target=update_macro_cache, daemon=True).start()
    return {
        "message": "매크로 지표 캐시 업데이트 시작",
        "status": "updating",
        "note": "하루 1회 자동 갱신 (미국 장 개장 시간: 06:30 PST)"
    }

