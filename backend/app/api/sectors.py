from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf

router = APIRouter()

class SectorPerformance(BaseModel):
    name: str
    symbol: str
    daily: float
    weekly: float
    monthly: float
    ytd: float
    description: str

# 섹터 ETF 매핑
SECTOR_ETFS = {
    "XLK": {"name": "기술", "description": "소프트웨어, 하드웨어, 반도체", "size": 28},
    "XLF": {"name": "금융", "description": "은행, 보험, 자산관리", "size": 13},
    "XLV": {"name": "헬스케어", "description": "제약, 생명공학, 의료기기", "size": 14},
    "XLY": {"name": "소비재", "description": "자동차, 소매, 레저", "size": 12},
    "XLC": {"name": "통신", "description": "미디어, 엔터테인먼트, 통신", "size": 9},
    "XLI": {"name": "산업재", "description": "항공우주, 건설, 제조", "size": 10},
    "XLE": {"name": "에너지", "description": "석유, 가스, 에너지", "size": 4},
    "XLU": {"name": "유틸리티", "description": "전력, 수도, 가스 공급", "size": 3},
    "XLRE": {"name": "부동산", "description": "부동산 투자 신탁", "size": 3},
    "XLB": {"name": "소재", "description": "화학, 건설자재, 금속", "size": 3},
    "XLP": {"name": "필수소비재", "description": "식품, 음료, 생활용품", "size": 6},
}

def calculate_return(hist, days_ago: int) -> Optional[float]:
    """주어진 일수 전 대비 수익률 계산"""
    try:
        if len(hist) <= days_ago:
            return None
        current_price = hist['Close'].iloc[-1]
        past_price = hist['Close'].iloc[-days_ago-1]
        return round(((current_price - past_price) / past_price) * 100, 2)
    except:
        return None

@router.get("/performance")
async def get_sector_performance():
    """섹터별 수익률 (실시간 yfinance 데이터)"""
    sectors = []
    
    for symbol, info in SECTOR_ETFS.items():
        try:
            # yfinance로 데이터 가져오기
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="1y")
            
            if hist.empty:
                continue
            
            # 수익률 계산
            daily = calculate_return(hist, 1) or 0
            weekly = calculate_return(hist, 5) or 0
            monthly = calculate_return(hist, 21) or 0
            ytd = calculate_return(hist, 252) or 0
            
            sectors.append({
                "name": info["name"],
                "symbol": symbol,
                "daily": daily,
                "weekly": weekly,
                "monthly": monthly,
                "ytd": ytd,
                "description": info["description"],
                "size": info["size"]
            })
            
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            # 에러 시 기본값
            sectors.append({
                "name": info["name"],
                "symbol": symbol,
                "daily": 0,
                "weekly": 0,
                "monthly": 0,
                "ytd": 0,
                "description": info["description"],
                "size": info["size"]
            })
    
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

