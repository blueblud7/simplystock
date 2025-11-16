from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf
from app.utils.cache import get_cache, set_cache

router = APIRouter()

class Stock52Week(BaseModel):
    symbol: str
    name: str
    price: float
    high_52week: Optional[float] = None
    low_52week: Optional[float] = None
    change: float
    change_percent: float
    days_at_high: Optional[int] = None
    days_at_low: Optional[int] = None
    sector: str
    market_cap: float
    volume: float

# 주요 종목 리스트 (미국 + 한국)
POPULAR_TICKERS = [
    # 미국 대표 종목
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B",
    "V", "JNJ", "WMT", "UNH", "MA", "PG", "JPM", "HD", "DIS", "BAC",
    "ADBE", "NFLX", "XOM", "VZ", "CMCSA", "AVGO", "COST", "PEP", "TMO",
    "ABT", "CSCO", "DHR", "ACN", "NKE", "MRK", "TXN", "PM", "LIN", "NEE",
    "HON", "UPS", "QCOM", "RTX", "AMGN", "BMY", "LOW", "INTU", "SPGI",
    # 한국 대표 종목 (KRX)
    "005930.KS",  # 삼성전자
    "000660.KS",  # SK하이닉스
    "035420.KS",  # NAVER
    "005380.KS",  # 현대차
    "051910.KS",  # LG화학
    "006400.KS",  # 삼성SDI
    "035720.KS",  # 카카오
    "028260.KS",  # 삼성물산
    "068270.KS",  # 셀트리온
    "105560.KS",  # KB금융
    "055550.KS",  # 신한지주
    "012330.KS",  # 현대모비스
    "003670.KS",  # 포스코홀딩스
    "207940.KS",  # 삼성바이오로직스
    "086790.KS",  # 하나금융지주
]

def get_52week_stocks(tickers: List[str], is_high: bool = True, limit: int = 20):
    """52주 신고가/신저가 종목 가져오기"""
    results = []
    
    for ticker_symbol in tickers[:50]:  # 최대 50개만 체크 (성능)
        try:
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period="1y")
            info = ticker.info
            
            if hist.empty:
                continue
            
            current_price = float(hist['Close'].iloc[-1])
            prev_price = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
            change = current_price - prev_price
            change_percent = (change / prev_price) * 100 if prev_price != 0 else 0
            
            high_52week = float(hist['High'].max())
            low_52week = float(hist['Low'].min())
            
            # 신고가: 현재가가 52주 최고가의 98% 이상
            # 신저가: 현재가가 52주 최저가의 102% 이하
            if is_high:
                if current_price >= high_52week * 0.98:
                    results.append({
                        "symbol": ticker_symbol,
                        "name": info.get("longName", info.get("shortName", ticker_symbol)),
                        "price": round(current_price, 2),
                        "high_52week": round(high_52week, 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2),
                        "days_at_high": 1,  # 간단히 1일로 설정
                        "sector": info.get("sector", "Unknown"),
                        "market_cap": round(info.get("marketCap", 0) / 1e9, 2) if info.get("marketCap") else 0,
                        "volume": round(info.get("volume", 0) / 1e6, 1) if info.get("volume") else 0
                    })
            else:
                if current_price <= low_52week * 1.02:
                    results.append({
                        "symbol": ticker_symbol,
                        "name": info.get("longName", info.get("shortName", ticker_symbol)),
                        "price": round(current_price, 2),
                        "low_52week": round(low_52week, 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2),
                        "days_at_low": 1,  # 간단히 1일로 설정
                        "sector": info.get("sector", "Unknown"),
                        "market_cap": round(info.get("marketCap", 0) / 1e9, 2) if info.get("marketCap") else 0,
                        "volume": round(info.get("volume", 0) / 1e6, 1) if info.get("volume") else 0
                    })
        except Exception as e:
            print(f"Error fetching {ticker_symbol}: {e}")
            continue
    
    # 정렬: 신고가는 change_percent 내림차순, 신저가는 change_percent 오름차순
    results.sort(key=lambda x: x["change_percent"], reverse=is_high)
    
    return results[:limit]

@router.get("/highs")
async def get_52week_highs(limit: int = Query(20, ge=1, le=100)):
    """52주 신고가 종목 (실시간 yfinance 데이터) - 캐시 300초"""
    cache_key = f"52week:highs:{limit}"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key}")
    stocks = get_52week_stocks(POPULAR_TICKERS, is_high=True, limit=limit)
    result = {
        "stocks": stocks,
        "total": len(stocks)
    }
    
    # 캐시에 저장 (300초 = 5분)
    set_cache(cache_key, result, ttl_seconds=300)
    return result

@router.get("/lows")
async def get_52week_lows(limit: int = Query(20, ge=1, le=100)):
    """52주 신저가 종목 (실시간 yfinance 데이터) - 캐시 300초"""
    cache_key = f"52week:lows:{limit}"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key}")
    stocks = get_52week_stocks(POPULAR_TICKERS, is_high=False, limit=limit)
    result = {
        "stocks": stocks,
        "total": len(stocks)
    }
    
    # 캐시에 저장 (300초 = 5분)
    set_cache(cache_key, result, ttl_seconds=300)
    return result

@router.get("/stats")
async def get_52week_stats():
    """52주 신고가/신저가 통계"""
    return {
        "highs_count": 127,
        "lows_count": 42,
        "ratio": 3.02,
        "market_breadth": "strong"
    }

