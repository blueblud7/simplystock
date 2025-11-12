from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class SectorPerformance(BaseModel):
    name: str
    symbol: str
    daily: float
    weekly: float
    monthly: float
    ytd: float
    description: str

@router.get("/performance")
async def get_sector_performance():
    """섹터별 수익률"""
    sectors = [
        {
            "name": "기술",
            "symbol": "XLK",
            "daily": 1.45,
            "weekly": 3.2,
            "monthly": 8.5,
            "ytd": 42.3,
            "description": "소프트웨어, 하드웨어, 반도체 등"
        },
        {
            "name": "금융",
            "symbol": "XLF",
            "daily": 0.82,
            "weekly": 2.1,
            "monthly": 5.3,
            "ytd": 28.7,
            "description": "은행, 보험, 자산관리 등"
        },
    ]
    return {"sectors": sectors}

@router.get("/history/{symbol}")
async def get_sector_history(
    symbol: str,
    period: str = Query("1m", regex="^(1d|1w|1m|3m|1y)$")
):
    """섹터 히스토리 데이터"""
    # TODO: 실제 데이터베이스에서 조회
    return {
        "symbol": symbol,
        "period": period,
        "data": []
    }

