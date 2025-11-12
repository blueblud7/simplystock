from fastapi import APIRouter, Query
from typing import List
from pydantic import BaseModel

router = APIRouter()

class Stock52Week(BaseModel):
    symbol: str
    name: str
    price: float
    high_52week: float | None = None
    low_52week: float | None = None
    change: float
    change_percent: float
    days_at_high: int | None = None
    days_at_low: int | None = None
    sector: str
    market_cap: float
    volume: float

@router.get("/highs")
async def get_52week_highs(limit: int = Query(20, ge=1, le=100)):
    """52주 신고가 종목"""
    # TODO: 실제 데이터베이스에서 조회
    return {
        "stocks": [],
        "total": 0
    }

@router.get("/lows")
async def get_52week_lows(limit: int = Query(20, ge=1, le=100)):
    """52주 신저가 종목"""
    # TODO: 실제 데이터베이스에서 조회
    return {
        "stocks": [],
        "total": 0
    }

@router.get("/stats")
async def get_52week_stats():
    """52주 신고가/신저가 통계"""
    return {
        "highs_count": 127,
        "lows_count": 42,
        "ratio": 3.02,
        "market_breadth": "strong"
    }

