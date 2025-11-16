from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf
from app.utils.cache import cache_result, get_cache, set_cache

router = APIRouter()

class MarketIndex(BaseModel):
    name: str
    symbol: str
    price: float
    change: float
    change_percent: float
    timestamp: datetime

# 주요 지수 심볼 매핑
MAJOR_INDICES = {
    "S&P 500": {"symbol": "^GSPC", "display_symbol": "SPX"},
    "NASDAQ": {"symbol": "^IXIC", "display_symbol": "IXIC"},
    "KOSPI": {"symbol": "^KS11", "display_symbol": "KOSPI"},
    "KOSDAQ": {"symbol": "^KQ11", "display_symbol": "KOSDAQ"},
    "USD/KRW": {"symbol": "KRW=X", "display_symbol": "USDKRW"},
}

def get_index_data(name: str, yf_symbol: str, display_symbol: str):
    """yfinance를 사용하여 지수 데이터 가져오기"""
    try:
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period="2d")
        
        if hist.empty:
            return None
        
        current_price = float(hist['Close'].iloc[-1])
        prev_price = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
        change = current_price - prev_price
        change_percent = (change / prev_price) * 100 if prev_price != 0 else 0
        
        return {
            "name": name,
            "symbol": display_symbol,
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 3),
            "timestamp": datetime.now()
        }
    except Exception as e:
        print(f"Error fetching {name} ({yf_symbol}): {e}")
        return None

@router.get("/overview")
async def get_market_overview():
    """주요 지수 현황 (실시간 yfinance 데이터) - 캐시 60초"""
    cache_key = "market:overview"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key}")
    indices = []
    
    for name, info in MAJOR_INDICES.items():
        data = get_index_data(name, info["symbol"], info["display_symbol"])
        if data:
            indices.append(data)
    
    result = {"indices": indices}
    
    # 캐시에 저장 (60초)
    set_cache(cache_key, result, ttl_seconds=60)
    
    return result

