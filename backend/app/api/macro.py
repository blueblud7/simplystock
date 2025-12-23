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

def clear_macro_cache():
    """매크로 캐시 초기화"""
    global _macro_cache
    _macro_cache = {
        "data": {},
        "last_update": None,
        "updating": False
    }
    print("🗑️ 매크로 캐시 초기화 완료")

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
    
    # 마지막 업데이트가 6시간 이상 지났으면 업데이트 (더 자주 업데이트)
    time_diff = now - last_update
    if time_diff.total_seconds() > 6 * 3600:  # 6시간
        return True
    
    # 마지막 업데이트가 오늘 아니면 업데이트
    if last_update.date() != now.date():
        # 장 개장 시간(06:30 PST) 이후인지 확인
        market_open = now.replace(hour=6, minute=30, second=0, microsecond=0)
        if now >= market_open:
            return True
    
    return False

def get_fear_greed_index():
    """CNN Fear & Greed Index 가져오기 (CNN 공식 데이터 스크래핑)"""
    try:
        # 방법 1: fear-and-greed 패키지 사용 (우선 시도)
        try:
            import fear_and_greed
            index = fear_and_greed.get()
            
            if index:
                # value는 float일 수 있으므로 int로 변환
                value = int(round(index.value))
                
                # description을 적절한 형식으로 변환
                description_lower = index.description.lower() if hasattr(index, 'description') else ""
                
                # CNN의 description을 표준 형식으로 변환
                if 'extreme greed' in description_lower or 'extreme_greed' in description_lower:
                    classification = "Extreme Greed"
                elif 'greed' in description_lower:
                    classification = "Greed"
                elif 'neutral' in description_lower:
                    classification = "Neutral"
                elif 'extreme fear' in description_lower or 'extreme_fear' in description_lower:
                    classification = "Extreme Fear"
                elif 'fear' in description_lower:
                    classification = "Fear"
                else:
                    # 값에 따른 분류 (fallback)
                    if value >= 75:
                        classification = "Extreme Greed"
                    elif value >= 55:
                        classification = "Greed"
                    elif value >= 45:
                        classification = "Neutral"
                    elif value >= 25:
                        classification = "Fear"
                    else:
                        classification = "Extreme Fear"
                
                # timestamp 처리 (timezone-aware datetime을 일반 datetime으로 변환)
                if hasattr(index, 'last_update') and index.last_update:
                    timestamp = index.last_update
                    # timezone-aware인 경우 UTC로 변환 후 timezone 제거
                    if hasattr(timestamp, 'tzinfo') and timestamp.tzinfo is not None:
                        timestamp = timestamp.replace(tzinfo=None)
                else:
                    timestamp = datetime.now()
                
                return {
                    "value": value,
                    "classification": classification,
                    "timestamp": timestamp,
                    "source": "CNN (fear-and-greed package)"
                }
        except ImportError:
            print("⚠️ fear-and-greed 패키지가 설치되지 않았습니다. pip install fear-and-greed 실행 필요")
        except Exception as e:
            print(f"❌ fear-and-greed 패키지 에러: {e}")
            import traceback
            traceback.print_exc()
        
        # 방법 2: CNN 페이지 직접 스크래핑
        import requests
        from bs4 import BeautifulSoup
        
        url = "https://www.cnn.com/markets/fear-and-greed"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # CNN Fear & Greed Index 값 찾기 (페이지 구조에 따라 다를 수 있음)
            # 여러 가능한 선택자 시도
            selectors = [
                {'class': 'market-fng-gauge__dial-number-value'},
                {'id': 'fear-greed-value'},
                {'data-testid': 'fear-greed-index'},
                {'class': 'fear-greed-value'},
            ]
            
            value = None
            for selector in selectors:
                element = soup.find(**selector)
                if element:
                    try:
                        value = int(element.get_text().strip())
                        break
                    except:
                        continue
            
            # JSON 데이터에서 찾기 시도
            if value is None:
                import re
                json_match = re.search(r'"value":\s*(\d+)', response.text)
                if json_match:
                    value = int(json_match.group(1))
            
            if value is not None:
                # 값에 따른 분류
                if value >= 75:
                    classification = "Extreme Greed"
                elif value >= 55:
                    classification = "Greed"
                elif value >= 45:
                    classification = "Neutral"
                elif value >= 25:
                    classification = "Fear"
                else:
                    classification = "Extreme Fear"
                
                return {
                    "value": value,
                    "classification": classification,
                    "timestamp": datetime.now(),
                    "source": "CNN (direct scraping)"
                }
    except Exception as e:
        print(f"❌ CNN Fear & Greed Index 스크래핑 에러: {e}")
    
    # Fallback 1: Alternative.me API (암호화폐용이지만 참고)
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
                    "timestamp": datetime.fromtimestamp(int(data["data"][0]["timestamp"])),
                    "source": "Alternative.me (Fallback)"
                }
    except Exception as e:
        print(f"Alternative.me API 에러: {e}")
    
    # Fallback 2: VIX 기반 추정
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
            "timestamp": datetime.now(),
            "source": "VIX-based estimation"
        }
    except:
        pass
    
    # 최종 Fallback: 기본값
    return {
        "value": 50, 
        "classification": "Neutral", 
        "timestamp": datetime.now(),
        "source": "Default"
    }

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
        
        # 환율 정보 가져오기
        try:
            krw_ticker = yf.Ticker("KRW=X")
            krw_hist = krw_ticker.history(period="5d")
            if not krw_hist.empty:
                current_krw = round(krw_hist['Close'].iloc[-1], 2)
                prev_krw = round(krw_hist['Close'].iloc[-2], 2) if len(krw_hist) > 1 else current_krw
                usd_krw = {
                    "value": current_krw,
                    "change": round(current_krw - prev_krw, 2)
                }
            else:
                usd_krw = {"value": 1308.50, "change": 0}
        except:
            usd_krw = {"value": 1308.50, "change": 0}
        
        # DXY 가져오기
        try:
            dxy_ticker = yf.Ticker("DX-Y.NYB")
            dxy_hist = dxy_ticker.history(period="5d")
            if not dxy_hist.empty:
                current_dxy = round(dxy_hist['Close'].iloc[-1], 2)
                prev_dxy = round(dxy_hist['Close'].iloc[-2], 2) if len(dxy_hist) > 1 else current_dxy
                dxy = {
                    "value": current_dxy,
                    "change": round(current_dxy - prev_dxy, 2)
                }
            else:
                dxy = {"value": 104.25, "change": 0}
        except:
            dxy = {"value": 104.25, "change": 0}
        
        _macro_cache["data"] = {
            "fear_greed": fear_greed,
            "m2": m2,
            "fed_funds_rate": fed_rate,
            "vix": vix,
            "usd_krw": usd_krw,
            "dxy": dxy
        }
        _macro_cache["last_update"] = get_california_time()
        print(f"✅ 매크로 지표 캐시 업데이트 완료: {_macro_cache['last_update'].strftime('%Y-%m-%d %H:%M:%S %Z')}")
    except Exception as e:
        print(f"❌ 매크로 지표 캐시 업데이트 실패: {e}")
    finally:
        _macro_cache["updating"] = False

def get_cached_macro_data():
    """캐시된 매크로 데이터 가져오기 (6시간마다 자동 갱신)"""
    # 캐시가 비어있거나 오래되었으면 동기적으로 업데이트
    if not _macro_cache["data"] or should_update_cache():
        if not _macro_cache["updating"]:
            print("🔄 캐시가 비어있거나 오래되어 업데이트 시작...")
            update_macro_cache()
    
    # 백그라운드 업데이트는 비활성화 (항상 최신 데이터 보장)
    # if should_update_cache() and not _macro_cache["updating"]:
    #     from threading import Thread
    #     Thread(target=update_macro_cache, daemon=True).start()
    
    return _macro_cache["data"], _macro_cache["last_update"]

@router.get("/overview")
async def get_macro_overview(force_refresh: bool = False):
    """
    매크로 지표 개요
    
    - 6시간마다 자동 갱신
    - 마지막 업데이트 시간 포함
    - force_refresh=true로 강제 새로고침 가능
    """
    # force_refresh가 True이면 캐시 무시하고 즉시 업데이트
    if force_refresh:
        print("🔄 강제 새로고침 요청 - 캐시 무시")
        clear_macro_cache()
        update_macro_cache()
        cached_data, last_update = get_cached_macro_data()
    else:
        # 캐시를 강제로 확인하고 필요시 업데이트
        cached_data, last_update = get_cached_macro_data()
    
    # 캐시가 없거나 오래된 데이터면 즉시 새로 가져오기
    if not cached_data or should_update_cache():
        print("⚠️ 캐시가 없거나 오래되어 즉시 업데이트...")
        vix = get_vix_index()
        m2 = get_m2_money_supply()
        fed_rate = get_fed_funds_rate()
        fear_greed = get_fear_greed_index()
        # 환율 정보 가져오기
        try:
            krw_ticker = yf.Ticker("KRW=X")
            krw_hist = krw_ticker.history(period="5d")
            if not krw_hist.empty:
                current_krw = round(krw_hist['Close'].iloc[-1], 2)
                prev_krw = round(krw_hist['Close'].iloc[-2], 2) if len(krw_hist) > 1 else current_krw
                usd_krw = {
                    "value": current_krw,
                    "change": round(current_krw - prev_krw, 2)
                }
            else:
                usd_krw = {"value": 1308.50, "change": 0}
        except:
            usd_krw = {"value": 1308.50, "change": 0}
        
        # DXY 가져오기
        try:
            dxy_ticker = yf.Ticker("DX-Y.NYB")
            dxy_hist = dxy_ticker.history(period="5d")
            if not dxy_hist.empty:
                current_dxy = round(dxy_hist['Close'].iloc[-1], 2)
                prev_dxy = round(dxy_hist['Close'].iloc[-2], 2) if len(dxy_hist) > 1 else current_dxy
                dxy = {
                    "value": current_dxy,
                    "change": round(current_dxy - prev_dxy, 2)
                }
            else:
                dxy = {"value": 104.25, "change": 0}
        except:
            dxy = {"value": 104.25, "change": 0}
        
        last_update = get_california_time()
    else:
        fear_greed = cached_data.get("fear_greed", {})
        m2 = cached_data.get("m2", {})
        fed_rate = cached_data.get("fed_funds_rate", {})
        vix = cached_data.get("vix", {})
        usd_krw = cached_data.get("usd_krw", {"value": 1308.50, "change": 0})
        dxy = cached_data.get("dxy", {"value": 104.25, "change": 0})
    
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
            },
            "usd_krw": {
                "name": "USD/KRW",
                "value": usd_krw.get("value", 1308.50),
                "change": usd_krw.get("change", 0),
                "unit": "원",
                "timestamp": datetime.now()
            },
            "dxy": {
                "name": "Dollar Index (DXY)",
                "value": dxy.get("value", 104.25),
                "change": dxy.get("change", 0),
                "unit": "Index",
                "timestamp": datetime.now()
            }
        },
        "last_update": last_update.isoformat() if last_update else None,
        "next_update": "6시간마다 자동 갱신 (또는 수동 새로고침)"
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
    CNN Fear & Greed Index 히스토리
    
    최근 N일간의 Fear & Greed Index 추이
    CNN 공식 데이터를 스크래핑하여 제공
    """
    try:
        # CNN Fear & Greed Index 히스토리 가져오기
        import fear_and_greed
        
        # fear_and_greed 패키지가 히스토리 기능을 지원하는지 확인
        # 일부 버전에서는 get()만 지원하므로, 여러 날짜를 시도
        history = []
        
        # 최근 N일 데이터 수집 시도
        for i in range(min(days, 90)):  # 최대 90일
            try:
                # 날짜별로 가져오기 (패키지가 지원하는 경우)
                # 대부분의 경우 현재 값만 제공하므로, Alternative.me API를 보조로 사용
                pass
            except:
                break
        
        # CNN에서 직접 가져온 데이터가 있으면 반환
        if history:
            return {"history": history, "days": len(history), "source": "CNN"}
    except ImportError:
        print("⚠️ fear-and-greed 패키지가 설치되지 않았습니다.")
    except Exception as e:
        print(f"CNN Fear & Greed 히스토리 에러: {e}")
    
    # Fallback: Alternative.me API (암호화폐용이지만 히스토리 데이터 제공)
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
                return {
                    "history": history, 
                    "days": len(history),
                    "source": "Alternative.me (Fallback)",
                    "note": "CNN 공식 데이터를 가져올 수 없어 대체 소스 사용"
                }
    except Exception as e:
        print(f"Alternative.me 히스토리 API 에러: {e}")
    
    # 최종 Fallback: 빈 데이터
    return {
        "history": [], 
        "days": 0, 
        "note": "데이터를 가져올 수 없습니다. fear-and-greed 패키지 설치 필요: pip install fear-and-greed"
    }

@router.get("/history/interest-rates")
async def get_interest_rates_history(months: int = 12):
    """
    금리 히스토리 (FRED API)
    
    최근 N개월간의 연준 기준금리, 10년물, 2년물 국채 수익률
    """
    try:
        if not fred:
            return {
                "history": [], 
                "months": 0, 
                "note": "FRED API 키가 필요합니다. 환경 변수 FRED_API_KEY를 설정하세요.",
                "error": "FRED_API_KEY_MISSING"
            }
        
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
        error_msg = str(e)
        print(f"VIX 히스토리 에러: {e}")
        # 네트워크 에러 감지
        if any(keyword in error_msg.lower() for keyword in ['network', 'connection', 'timeout', 'unreachable', 'dns']):
            return {
                "history": [], 
                "days": 0, 
                "note": "네트워크 연결 실패: yfinance API에 접근할 수 없습니다.",
                "error": "NETWORK_ERROR"
            }
    
    return {
        "history": [], 
        "days": 0, 
        "note": "데이터를 가져올 수 없습니다",
        "error": "UNKNOWN_ERROR"
    }

@router.get("/history/m2")
async def get_m2_history(months: int = 12):
    """
    M2 통화량 히스토리 (FRED API)
    
    최근 N개월간의 M2 통화량 추이
    """
    try:
        if not fred:
            return {
                "history": [], 
                "months": 0, 
                "note": "FRED API 키가 필요합니다. 환경 변수 FRED_API_KEY를 설정하세요.",
                "error": "FRED_API_KEY_MISSING"
            }
        
        from datetime import timedelta
        start_date = (datetime.now() - timedelta(days=months * 30)).strftime('%Y-%m-%d')
        
        # M2 데이터 가져오기
        m2_data = fred.get_series('M2SL', observation_start=start_date)
        
        if len(m2_data) == 0:
            return {"history": [], "months": 0, "note": "데이터를 가져올 수 없습니다"}
        
        # 월별로 마지막 값 추출
        history = []
        for i in range(months):
            month_date = datetime.now() - timedelta(days=(months - i - 1) * 30)
            month_str = month_date.strftime('%Y-%m')
            
            # 해당 월의 데이터 필터링
            month_data = m2_data[m2_data.index.strftime('%Y-%m') == month_str]
            
            if len(month_data) > 0:
                value = round(float(month_data.iloc[-1]) / 1000, 2)  # Billions to Trillions
                history.append({
                    "date": month_date.strftime('%Y-%m'),
                    "value": value
                })
        
        return {"history": history, "months": len(history)}
    except Exception as e:
        print(f"M2 히스토리 에러: {e}")
        return {"history": [], "months": 0, "note": f"에러: {str(e)}"}

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
    
    캐시를 초기화하고 모든 매크로 지표를 다시 수집합니다.
    """
    # 캐시를 먼저 초기화
    clear_macro_cache()
    
    # 동기적으로 업데이트 (즉시 반영)
    update_macro_cache()
    
    # 업데이트된 데이터 반환
    updated_data = _macro_cache.get("data", {})
    fear_greed_value = updated_data.get("fear_greed", {}).get("value", "N/A")
    
    return {
        "message": "매크로 지표 캐시 초기화 및 업데이트 완료",
        "status": "updated",
        "note": "캐시가 초기화되고 최신 데이터로 업데이트되었습니다",
        "fear_greed_value": fear_greed_value,
        "last_update": _macro_cache.get("last_update")
    }

@router.post("/clear-cache")
async def clear_macro_cache_endpoint():
    """
    매크로 지표 캐시 강제 초기화
    
    캐시만 초기화하고 데이터는 다시 수집하지 않습니다.
    """
    clear_macro_cache()
    
    # 인메모리 캐시도 초기화
    from app.utils.cache import clear_cache
    clear_cache("market:overview")  # 시장 지수 캐시도 초기화
    
    return {
        "message": "매크로 지표 캐시 초기화 완료 (인메모리 캐시 포함)",
        "status": "cleared"
    }

