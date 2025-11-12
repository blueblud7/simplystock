from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class MarketIndex(BaseModel):
    name: str
    symbol: str
    price: float
    change: float
    change_percent: float
    timestamp: datetime

@router.get("/overview")
async def get_market_overview():
    """주요 지수 현황"""
    return {
        "indices": [
            {
                "name": "S&P 500",
                "symbol": "SPX",
                "price": 4783.45,
                "change": 1.24,
                "change_percent": 0.026
            },
            {
                "name": "NASDAQ",
                "symbol": "IXIC",
                "price": 15095.14,
                "change": 45.32,
                "change_percent": 0.301
            },
            {
                "name": "KOSPI",
                "symbol": "KS11",
                "price": 2594.35,
                "change": -8.45,
                "change_percent": -0.325
            }
        ]
    }

