from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf

router = APIRouter()

class MarketIndex(BaseModel):
    name: str
    symbol: str
    price: float
    change: float
    change_percent: float
    timestamp: datetime

MARKET_INDICES = {
    "^GSPC": {"symbol": "SPX", "name": "S&P 500"},
    "^IXIC": {"symbol": "IXIC", "name": "NASDAQ"},
    "^KS11": {"symbol": "KS11", "name": "KOSPI"},
    "KRW=X": {"symbol": "USDKRW", "name": "USD/KRW"},
}

def get_index_data(ticker_symbol: str, info: dict):
    """개별 지수 데이터 가져오기"""
    try:
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period="5d")
        
        if not hist.empty:
            current_price = round(hist['Close'].iloc[-1], 2)
            prev_price = round(hist['Close'].iloc[-2], 2) if len(hist) > 1 else current_price
            
            change = round(current_price - prev_price, 2)
            change_percent = round((change / prev_price) * 100, 2) if prev_price != 0 else 0
            
            return {
                "name": info["name"],
                "symbol": info["symbol"],
                "price": current_price,
                "change": change,
                "change_percent": change_percent,
                "timestamp": datetime.now()
            }
    except Exception as e:
        print(f"Error fetching {ticker_symbol}: {e}")
    
    # 기본값 반환
    return {
        "name": info["name"],
        "symbol": info["symbol"],
        "price": 0,
        "change": 0,
        "change_percent": 0,
        "timestamp": datetime.now()
    }

@router.get("/overview")
async def get_market_overview():
    """주요 지수 현황 (실시간 yfinance 데이터)"""
    indices = []
    
    for ticker_symbol, info in MARKET_INDICES.items():
        index_data = get_index_data(ticker_symbol, info)
        indices.append(index_data)
    
    return {"indices": indices}

