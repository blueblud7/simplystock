from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf
from app.utils.cache import get_cache, set_cache

router = APIRouter()

class SectorPerformance(BaseModel):
    name: str
    symbol: str
    daily: float
    weekly: float
    monthly: float
    ytd: float
    description: str

# 섹터 ETF 매핑 (미국 + 한국)
SECTOR_ETFS = {
    # 미국 섹터 ETF
    "XLK": {"name": "기술", "description": "소프트웨어, 하드웨어, 반도체", "size": 28, "market": "US"},
    "XLF": {"name": "금융", "description": "은행, 보험, 자산관리", "size": 13, "market": "US"},
    "XLV": {"name": "헬스케어", "description": "제약, 생명공학, 의료기기", "size": 14, "market": "US"},
    "XLY": {"name": "소비재", "description": "자동차, 소매, 레저", "size": 12, "market": "US"},
    "XLC": {"name": "통신", "description": "미디어, 엔터테인먼트, 통신", "size": 9, "market": "US"},
    "XLI": {"name": "산업재", "description": "항공우주, 건설, 제조", "size": 10, "market": "US"},
    "XLE": {"name": "에너지", "description": "석유, 가스, 에너지", "size": 4, "market": "US"},
    "XLU": {"name": "유틸리티", "description": "전력, 수도, 가스 공급", "size": 3, "market": "US"},
    "XLRE": {"name": "부동산", "description": "부동산 투자 신탁", "size": 3, "market": "US"},
    "XLB": {"name": "소재", "description": "화학, 건설자재, 금속", "size": 3, "market": "US"},
    "XLP": {"name": "필수소비재", "description": "식품, 음료, 생활용품", "size": 6, "market": "US"},
    # 한국 섹터 ETF (KODEX)
    "122630.KS": {"name": "한국IT", "description": "한국 정보기술 섹터", "size": 10, "market": "KR"},
    "091180.KS": {"name": "한국금융", "description": "한국 금융 섹터", "size": 10, "market": "KR"},
    "102960.KS": {"name": "한국필수소비재", "description": "한국 필수소비재 섹터", "size": 10, "market": "KR"},
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
    """섹터별 수익률 (실시간 yfinance 데이터) - 캐시 180초"""
    cache_key = "sectors:performance"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key}")
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
    
    result = {"sectors": sectors}
    
    # 캐시에 저장 (180초 = 3분)
    set_cache(cache_key, result, ttl_seconds=180)
    
    return result

@router.get("/history")
async def get_sectors_history(period: str = Query("1m", regex="^(1d|5d|1mo|3mo|1y)$")):
    """모든 섹터의 히스토리 데이터 - 캐시 300초"""
    cache_key = f"sectors:history:{period}"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key}")
    
    try:
        # 주요 섹터 5개만 선택 (성능)
        main_sectors = ["XLK", "XLF", "XLV", "XLE", "XLC"]
        all_data = []
        
        # 각 섹터의 히스토리 가져오기
        sector_histories = {}
        for symbol in main_sectors:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            if not hist.empty:
                sector_name = SECTOR_ETFS[symbol]["name"]
                sector_histories[sector_name] = hist
        
        # 날짜별로 데이터 병합
        if sector_histories:
            # 첫 번째 섹터의 날짜를 기준으로
            first_sector = list(sector_histories.values())[0]
            dates = first_sector.index
            
            for date in dates:
                date_str = date.strftime("%Y-%m-%d")
                data_point = {"date": date_str}
                
                # 각 섹터의 해당 날짜 수익률 계산
                for sector_name, hist in sector_histories.items():
                    if date in hist.index:
                        # 기준일 대비 수익률 계산
                        first_price = hist['Close'].iloc[0]
                        current_price = hist.loc[date, 'Close']
                        return_pct = ((current_price - first_price) / first_price) * 100
                        data_point[sector_name] = round(return_pct, 2)
                
                all_data.append(data_point)
        
        result = {
            "period": period,
            "data": all_data
        }
        
        # 캐시에 저장
        set_cache(cache_key, result, ttl_seconds=300)
        return result
        
    except Exception as e:
        print(f"Error fetching sector history: {e}")
        return {
            "period": period,
            "data": []
        }

