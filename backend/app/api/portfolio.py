from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter()

class PortfolioHolding(BaseModel):
    symbol: str
    quantity: float
    average_price: float

@router.get("/")
async def get_portfolio():
    """포트폴리오 조회"""
    return {
        "holdings": [],
        "total_value": 0,
        "total_return": 0
    }

@router.post("/")
async def create_portfolio(holdings: List[PortfolioHolding]):
    """포트폴리오 생성"""
    return {"message": "Portfolio created"}

