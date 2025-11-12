"""
주식 시장 데이터 수집 스크립트
주요 지수, 52주 신고가/신저가, 개별 종목 데이터를 수집합니다.
"""

import yfinance as yf
from datetime import datetime, timedelta
from typing import List, Dict
import pandas as pd

class MarketDataCollector:
    def __init__(self):
        self.major_indices = {
            "S&P 500": "^GSPC",
            "NASDAQ": "^IXIC",
            "Dow Jones": "^DJI",
            "KOSPI": "^KS11",
            "KOSDAQ": "^KQ11",
            "Nikkei 225": "^N225",
            "FTSE 100": "^FTSE"
        }
    
    def get_major_indices(self) -> Dict:
        """주요 지수 데이터 수집"""
        print("\n📊 주요 지수 데이터 수집...")
        
        results = {}
        
        for name, symbol in self.major_indices.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    prev_price = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                    change = current_price - prev_price
                    change_percent = (change / prev_price) * 100
                    
                    results[name] = {
                        "symbol": symbol,
                        "price": round(current_price, 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2),
                        "volume": int(hist['Volume'].iloc[-1]),
                        "timestamp": hist.index[-1].isoformat()
                    }
                    
                    print(f"  ✅ {name}: ${current_price:,.2f} ({change_percent:+.2f}%)")
            
            except Exception as e:
                print(f"  ❌ {name} error: {e}")
        
        return results
    
    def get_52week_highs_lows(self, tickers: List[str]) -> Dict:
        """
        52주 신고가/신저가 종목 검색
        tickers: 검색할 종목 티커 리스트
        """
        print("\n📈 52주 신고가/신저가 분석...")
        
        highs = []
        lows = []
        
        for ticker_symbol in tickers:
            try:
                ticker = yf.Ticker(ticker_symbol)
                hist = ticker.history(period="1y")
                info = ticker.info
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    high_52week = hist['High'].max()
                    low_52week = hist['Low'].min()
                    
                    # 52주 신고가 (현재가가 52주 최고가의 99% 이상)
                    if current_price >= high_52week * 0.99:
                        highs.append({
                            "symbol": ticker_symbol,
                            "name": info.get("longName", ticker_symbol),
                            "price": current_price,
                            "high_52week": high_52week,
                            "sector": info.get("sector", "Unknown")
                        })
                    
                    # 52주 신저가 (현재가가 52주 최저가의 101% 이하)
                    elif current_price <= low_52week * 1.01:
                        lows.append({
                            "symbol": ticker_symbol,
                            "name": info.get("longName", ticker_symbol),
                            "price": current_price,
                            "low_52week": low_52week,
                            "sector": info.get("sector", "Unknown")
                        })
            
            except Exception as e:
                print(f"  ⚠️ {ticker_symbol}: {e}")
                continue
        
        print(f"  📊 신고가: {len(highs)}개, 신저가: {len(lows)}개")
        
        return {
            "highs": highs,
            "lows": lows,
            "stats": {
                "highs_count": len(highs),
                "lows_count": len(lows),
                "ratio": len(highs) / len(lows) if len(lows) > 0 else 0
            }
        }
    
    def get_sp500_tickers(self) -> List[str]:
        """S&P 500 구성 종목 리스트 가져오기"""
        try:
            # Wikipedia에서 S&P 500 구성 종목 가져오기
            url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
            tables = pd.read_html(url)
            df = tables[0]
            tickers = df['Symbol'].tolist()
            # 일부 티커는 형식 변환 필요
            tickers = [ticker.replace('.', '-') for ticker in tickers]
            return tickers
        except Exception as e:
            print(f"❌ S&P 500 ticker list error: {e}")
            # 대안: 주요 종목만 반환
            return [
                "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
                "BRK-B", "UNH", "JNJ", "XOM", "V", "JPM", "PG", "MA"
            ]
    
    def collect_all(self):
        """모든 시장 데이터 수집"""
        print("\n" + "=" * 60)
        print("🚀 시장 데이터 수집 시작")
        print("=" * 60)
        
        results = {}
        
        # 1. 주요 지수
        results["indices"] = self.get_major_indices()
        
        # 2. 52주 신고가/신저가 (S&P 500 종목 중 샘플링)
        print("\n⏳ S&P 500 종목 리스트 가져오는 중...")
        sp500_tickers = self.get_sp500_tickers()
        print(f"  총 {len(sp500_tickers)}개 종목")
        
        # 전체를 다 검사하면 시간이 오래 걸리므로 일부만 샘플링
        sample_size = min(50, len(sp500_tickers))
        print(f"  샘플 크기: {sample_size}개 종목")
        
        results["52week"] = self.get_52week_highs_lows(sp500_tickers[:sample_size])
        
        print("\n" + "=" * 60)
        print("✅ 시장 데이터 수집 완료")
        print("=" * 60)
        
        return results

def main():
    collector = MarketDataCollector()
    data = collector.collect_all()
    
    # 결과 요약
    print("\n📊 수집 결과 요약:")
    print(f"  - 주요 지수: {len(data['indices'])}개")
    print(f"  - 52주 신고가: {data['52week']['stats']['highs_count']}개")
    print(f"  - 52주 신저가: {data['52week']['stats']['lows_count']}개")
    print(f"  - 신고가/신저가 비율: {data['52week']['stats']['ratio']:.2f}")
    
    # TODO: 데이터베이스에 저장

if __name__ == "__main__":
    main()

