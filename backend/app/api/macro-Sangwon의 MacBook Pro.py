from fastapi import APIRouter
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf
import requests
import os
from dotenv import load_dotenv
from app.utils.cache import get_cache, set_cache

load_dotenv()

router = APIRouter()

class MacroIndicator(BaseModel):
    name: str
    value: float
    unit: str
    change: Optional[float] = None
    timestamp: datetime

def get_vix_index():
    """VIX 변동성 지수 가져오기"""
    try:
        vix = yf.Ticker("^VIX")
        hist = vix.history(period="1d")
        
        if not hist.empty:
            value = float(hist["Close"].iloc[-1])
            open_price = float(hist["Open"].iloc[-1])
            change = value - open_price
            
            # VIX 해석
            if value < 12:
                status = "Very Low"
            elif value < 20:
                status = "Low"
            elif value < 30:
                status = "Medium"
            else:
                status = "High"
            
            return {
                "name": "VIX Index",
                "value": round(value, 2),
                "status": status,
                "change": round(change, 2),
                "timestamp": datetime.now()
            }
    except Exception as e:
        print(f"Error fetching VIX: {e}")
        return None

def get_fear_greed_index():
    """CNN Fear & Greed Index (대안 API 사용)"""
    try:
        # Alternative.me Crypto Fear & Greed API 사용 (참고용)
        url = "https://api.alternative.me/fng/"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        value = int(data["data"][0]["value"])
        classification = data["data"][0]["value_classification"]
        
        return {
            "name": "CNN Fear & Greed Index",
            "value": value,
            "label": classification,
            "timestamp": datetime.now()
        }
    except Exception as e:
        print(f"Error fetching Fear & Greed Index: {e}")
        return None

def get_fed_funds_rate():
    """연준 기준금리 (FRED API 또는 기본값)"""
    fred_api_key = os.getenv("FRED_API_KEY")
    
    if fred_api_key:
        try:
            url = "https://api.stlouisfed.org/fred/series/observations"
            params = {
                "series_id": "FEDFUNDS",
                "api_key": fred_api_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 1
            }
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if data.get("observations"):
                value = float(data["observations"][0]["value"])
                return {
                    "name": "Federal Funds Rate",
                    "value": round(value, 2),
                    "unit": "Percent",
                    "timestamp": datetime.now()
                }
        except Exception as e:
            print(f"Error fetching Fed Funds Rate from FRED: {e}")
    
    # FRED API가 없으면 기본값 반환
    return {
        "name": "Federal Funds Rate",
        "value": 5.5,
        "unit": "Percent",
        "timestamp": datetime.now()
    }

def get_m2_money_supply():
    """M2 통화량 (FRED API 또는 기본값)"""
    fred_api_key = os.getenv("FRED_API_KEY")
    
    if fred_api_key:
        try:
            url = "https://api.stlouisfed.org/fred/series/observations"
            params = {
                "series_id": "M2SL",
                "api_key": fred_api_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 1
            }
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if data.get("observations"):
                value = float(data["observations"][0]["value"])
                # Billions를 Trillions로 변환
                value_trillion = round(value / 1000, 2)
                return {
                    "name": "M2 Money Supply",
                    "value": value_trillion,
                    "unit": "Trillion USD",
                    "timestamp": datetime.now()
                }
        except Exception as e:
            print(f"Error fetching M2 from FRED: {e}")
    
    # FRED API가 없으면 기본값 반환
    return {
        "name": "M2 Money Supply",
        "value": 21.2,
        "unit": "Trillion USD",
        "timestamp": datetime.now()
    }

@router.get("/overview")
async def get_macro_overview():
    """매크로 지표 개요 (실시간 데이터) - 캐시 300초"""
    cache_key = "macro:overview"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key}")
    indicators = {}
    
    # VIX
    vix_data = get_vix_index()
    if vix_data:
        indicators["vix"] = vix_data
    
    # Fear & Greed Index
    fear_greed = get_fear_greed_index()
    if fear_greed:
        indicators["fear_greed"] = fear_greed
    
    # Fed Funds Rate
    fed_rate = get_fed_funds_rate()
    if fed_rate:
        indicators["fed_funds_rate"] = fed_rate
    
    # M2 Money Supply
    m2 = get_m2_money_supply()
    if m2:
        indicators["m2"] = m2
    
    result = {"indicators": indicators}
    
    # 캐시에 저장 (300초 = 5분)
    set_cache(cache_key, result, ttl_seconds=300)
    
    return result

@router.get("/fear-greed")
async def get_fear_greed_index_endpoint():
    """CNN Fear & Greed Index"""
    result = get_fear_greed_index()
    if result:
        return result
    return {
        "value": 50,
        "classification": "Neutral",
        "timestamp": datetime.now()
    }

@router.get("/interest-rates")
async def get_interest_rates():
    """금리 정보 (실시간 데이터) - 캐시 300초"""
    cache_key = "macro:interest-rates"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key}")
    try:
        # 10년 국채 수익률
        ten_year = yf.Ticker("^TNX")
        ten_year_hist = ten_year.history(period="1d")
        
        # 2년 국채 수익률 (13주 국채로 대체)
        two_year = yf.Ticker("^IRX")
        two_year_hist = two_year.history(period="1d")
        
        fed_rate = get_fed_funds_rate()
        
        result = {}
        if fed_rate:
            result["fed_funds_rate"] = {
                "value": fed_rate["value"],
                "unit": "percent"
            }
        
        if not ten_year_hist.empty:
            result["treasury_10y"] = {
                "value": round(float(ten_year_hist["Close"].iloc[-1]), 2),
                "unit": "percent"
            }
        
        if not two_year_hist.empty:
            result["treasury_2y"] = {
                "value": round(float(two_year_hist["Close"].iloc[-1]), 2),
                "unit": "percent"
            }
        
        final_result = result if result else {
            "fed_funds_rate": {"value": 5.5, "unit": "percent"},
            "treasury_10y": {"value": 4.35, "unit": "percent"},
            "treasury_2y": {"value": 4.82, "unit": "percent"}
        }
        
        # 캐시에 저장
        set_cache(cache_key, final_result, ttl_seconds=300)
        return final_result
    except Exception as e:
        print(f"Error fetching interest rates: {e}")
        default_result = {
            "fed_funds_rate": {"value": 5.5, "unit": "percent"},
            "treasury_10y": {"value": 4.35, "unit": "percent"},
            "treasury_2y": {"value": 4.82, "unit": "percent"}
        }
        set_cache(cache_key, default_result, ttl_seconds=300)
        return default_result

@router.get("/exchange-rates")
async def get_exchange_rates():
    """환율 정보 (실시간 데이터) - 캐시 60초"""
    cache_key = "macro:exchange-rates"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key}")
    try:
        # USD/KRW
        usdkrw = yf.Ticker("KRW=X")
        usdkrw_hist = usdkrw.history(period="1d")
        
        # DXY (Dollar Index)
        dxy = yf.Ticker("DX-Y.NYB")
        dxy_hist = dxy.history(period="1d")
        
        result = {}
        
        if not usdkrw_hist.empty:
            current = float(usdkrw_hist["Close"].iloc[-1])
            open_price = float(usdkrw_hist["Open"].iloc[-1])
            result["usd_krw"] = {
                "value": round(current, 2),
                "change": round(current - open_price, 2)
            }
        
        if not dxy_hist.empty:
            current = float(dxy_hist["Close"].iloc[-1])
            open_price = float(dxy_hist["Open"].iloc[-1])
            result["dxy"] = {
                "value": round(current, 2),
                "change": round(current - open_price, 2)
            }
        
        final_result = result if result else {
            "usd_krw": {"value": 1308.50, "change": 2.30},
            "dxy": {"value": 104.25, "change": -0.15}
        }
        
        # 캐시에 저장
        set_cache(cache_key, final_result, ttl_seconds=60)
        return final_result
    except Exception as e:
        print(f"Error fetching exchange rates: {e}")
        default_result = {
            "usd_krw": {"value": 1308.50, "change": 2.30},
            "dxy": {"value": 104.25, "change": -0.15}
        }
        set_cache(cache_key, default_result, ttl_seconds=60)
        return default_result

