from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf
import time
from app.utils.cache import get_cache, set_cache

router = APIRouter()

class MarketIndex(BaseModel):
    name: str
    symbol: str
    price: float
    change: float
    change_percent: float

# 주요 지수 및 자산 정의 (실제 지수 심볼 사용)
MARKET_INDICES = {
    # 미국 주요 지수 (실제 지수)
    "^GSPC": {"name": "S&P 500", "symbol": "SPX"},
    "^IXIC": {"name": "NASDAQ", "symbol": "IXIC"},
    "^DJI": {"name": "Dow Jones", "symbol": "DJI"},
    "^RUT": {"name": "Russell 2000", "symbol": "RUT"},
    
    # 한국 지수 (직접 티커 사용)
    "^KS11": {"name": "KOSPI", "symbol": "KOSPI"},
    "^KQ11": {"name": "KOSDAQ", "symbol": "KOSDAQ"},
    
    # 기타 주요 지수
    "^N225": {"name": "Nikkei 225", "symbol": "N225"},
    "^FTSE": {"name": "FTSE 100", "symbol": "FTSE"},
    
    # 상품 및 암호화폐
    "GC=F": {"name": "Gold", "symbol": "GOLD"},
    "BTC-USD": {"name": "Bitcoin", "symbol": "BTC"},
}

def get_index_data(symbol: str, info: dict, retry_count: int = 3) -> Optional[dict]:
    """지수 데이터 가져오기 (재시도 로직 포함)"""
    for attempt in range(retry_count):
        try:
            # API 제한 방지를 위한 딜레이
            if attempt > 0:
                delay = min(2 ** attempt, 10)  # 지수 백오프: 2초, 4초, 최대 10초
                print(f"⏳ {symbol} 재시도 {attempt + 1}/{retry_count} - {delay}초 대기...")
                time.sleep(delay)
            
            ticker = yf.Ticker(symbol)
            
            # 더 긴 기간으로 시도 (5일)
            hist = ticker.history(period="5d")
            
            if hist.empty:
                # info에서 가져오기 시도
                try:
                    time.sleep(0.5)  # API 제한 방지
                    ticker_info = ticker.info
                    current_price = ticker_info.get('regularMarketPrice') or ticker_info.get('previousClose', 0)
                    prev_close = ticker_info.get('previousClose', current_price)
                    change = current_price - prev_close
                    change_percent = (change / prev_close) * 100 if prev_close > 0 else 0
                    
                    if current_price > 0:
                        return {
                            "name": info["name"],
                            "symbol": info["symbol"],
                            "price": round(current_price, 2),
                            "change": round(change, 2),
                            "change_percent": round(change_percent, 2)
                        }
                except Exception as info_error:
                    if "429" in str(info_error) or "Too Many Requests" in str(info_error):
                        if attempt < retry_count - 1:
                            continue  # 재시도
                    pass
            
            if hist.empty:
                print(f"⚠️ {symbol}: 데이터 없음 (시도 {attempt + 1}/{retry_count})")
                if attempt < retry_count - 1:
                    continue
                return None
            
            current_price = float(hist['Close'].iloc[-1])
            
            # 이전 종가 찾기 (거래일 기준)
            prev_price = current_price
            if len(hist) > 1:
                # 마지막에서 두 번째 거래일 찾기
                for i in range(len(hist) - 2, -1, -1):
                    if hist['Volume'].iloc[i] > 0:  # 거래량이 있는 날
                        prev_price = float(hist['Close'].iloc[i])
                        break
            
            change = current_price - prev_price
            change_percent = (change / prev_price) * 100 if prev_price > 0 else 0
            
            return {
                "name": info["name"],
                "symbol": info["symbol"],
                "price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2)
            }
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "Too Many Requests" in error_str:
                if attempt < retry_count - 1:
                    print(f"⚠️ {symbol}: API 제한 (시도 {attempt + 1}/{retry_count})")
                    continue
                else:
                    print(f"❌ {symbol}: API 제한으로 인한 최종 실패")
            else:
                print(f"❌ Error fetching {symbol}: {e}")
                if attempt < retry_count - 1:
                    continue
                import traceback
                traceback.print_exc()
            return None
    
    return None

@router.get("/overview")
async def get_market_overview():
    """
    주요 시장 지수 및 자산 개요
    
    주요 지수, 금, 비트코인 등의 현재가와 등락률을 반환합니다.
    캐시: 5분
    
    네트워크 차단 환경에서는 빈 배열 또는 기본값을 반환할 수 있습니다.
    """
    cache_key = "market:overview"
    
    # 캐시 확인
    cached = get_cache(cache_key)
    if cached is not None:
        print(f"✅ 캐시 히트: {cache_key}")
        return cached
    
    print(f"❌ 캐시 미스: {cache_key} - 데이터 로딩 중...")
    
    indices = []
    network_errors = []
    
    for idx, (symbol, info) in enumerate(MARKET_INDICES.items()):
        # API 제한 방지를 위한 요청 간 딜레이
        if idx > 0:
            time.sleep(0.5)  # 각 요청 사이 0.5초 대기
        
        try:
            index_data = get_index_data(symbol, info)
            if index_data:
                indices.append(index_data)
            else:
                network_errors.append(f"{info['name']}: 데이터 조회 실패")
        except Exception as e:
            error_msg = str(e)
            # 네트워크 관련 에러 감지
            if any(keyword in error_msg.lower() for keyword in ['network', 'connection', 'timeout', 'unreachable', 'dns']):
                network_errors.append(f"{info['name']}: 네트워크 연결 실패")
            else:
                network_errors.append(f"{info['name']}: {error_msg}")
    
    result = {
        "indices": indices,
        "note": f"총 {len(indices)}개 지수 조회 성공" + (f", {len(network_errors)}개 실패" if network_errors else "")
    }
    
    # 네트워크 에러가 있으면 로그 출력
    if network_errors:
        print(f"⚠️ 네트워크 에러 발생: {', '.join(network_errors)}")
    
    # 캐시에 저장 (5분으로 증가 - API 제한 방지)
    # 네트워크 에러가 있어도 캐시 저장 (빈 배열이라도)
    set_cache(cache_key, result, ttl_seconds=300)
    
    return result

@router.get("/indices/{symbol}")
async def get_index_detail(symbol: str):
    """
    특정 지수의 상세 정보
    
    symbol: 지수 심볼 (예: SPX, IXIC, DJI, RUT, GOLD, BTC 등)
    """
    # 심볼을 yfinance 티커로 변환
    ticker_map = {}
    for yf_symbol, info in MARKET_INDICES.items():
        ticker_map[info["symbol"]] = yf_symbol
    
    if symbol not in ticker_map:
        raise HTTPException(status_code=404, detail=f"지수를 찾을 수 없습니다: {symbol}")
    
    yf_symbol = ticker_map[symbol]
    info = MARKET_INDICES[yf_symbol]
    
    index_data = get_index_data(yf_symbol, info)
    
    if not index_data:
        raise HTTPException(status_code=500, detail="데이터를 가져올 수 없습니다")
    
    return index_data
