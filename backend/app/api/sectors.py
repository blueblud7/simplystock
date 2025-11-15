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

@router.get("/history")
async def get_sectors_history(
    days: int = Query(30, ge=1, le=365)
):
    """
    섹터별 히스토리 데이터 (yfinance)
    
    최근 N일간의 모든 섹터 수익률 추이를 반환합니다.
    """
    try:
        history = []
        
        # 각 섹터 ETF의 히스토리 데이터 수집
        for symbol, info in SECTOR_ETFS.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period=f"{days}d")
                
                if not hist.empty:
                    # 날짜별 수익률 계산
                    for i, (date, row) in enumerate(hist.iterrows()):
                        if i == 0:
                            continue  # 첫날은 변화율 계산 불가
                        
                        prev_close = hist['Close'].iloc[i-1]
                        current_close = row['Close']
                        change_percent = ((current_close - prev_close) / prev_close * 100) if prev_close > 0 else 0
                        
                        # 해당 날짜의 데이터 찾기 또는 생성
                        date_str = date.strftime("%Y-%m-%d")
                        existing_entry = next((item for item in history if item['date'] == date_str), None)
                        
                        if existing_entry:
                            existing_entry[info['name']] = round(change_percent, 2)
                        else:
                            history.append({
                                'date': date_str,
                                info['name']: round(change_percent, 2)
                            })
            except Exception as e:
                print(f"Error fetching history for {symbol}: {e}")
                continue
        
        # 날짜순 정렬
        history.sort(key=lambda x: x['date'])
        
        return {
            "history": history[-days:],  # 최근 N일
            "days": len(history),
            "sectors": list(SECTOR_ETFS.values())
        }
    except Exception as e:
        print(f"Error in get_sectors_history: {e}")
        return {
            "history": [],
            "days": 0,
            "sectors": [],
            "error": str(e)
        }

