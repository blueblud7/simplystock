"""
섹터별 데이터 수집 스크립트
SPDR 섹터 ETF 데이터를 통해 11개 섹터의 퍼포먼스를 추적합니다.
"""

import yfinance as yf
from datetime import datetime, timedelta
from typing import Dict, List
import pandas as pd

class SectorDataCollector:
    def __init__(self):
        # SPDR 섹터 ETF
        self.sector_etfs = {
            "기술": "XLK",
            "금융": "XLF",
            "헬스케어": "XLV",
            "소비재": "XLY",
            "통신": "XLC",
            "산업재": "XLI",
            "에너지": "XLE",
            "유틸리티": "XLU",
            "부동산": "XLRE",
            "소재": "XLB",
            "필수소비재": "XLP"
        }
    
    def calculate_returns(self, ticker: yf.Ticker, periods: List[int]) -> Dict:
        """
        주어진 기간들에 대한 수익률 계산
        periods: [1, 7, 30, 252] (일, 주, 월, 년)
        """
        hist = ticker.history(period="1y")
        
        if hist.empty:
            return None
        
        current_price = hist['Close'].iloc[-1]
        returns = {}
        
        for period in periods:
            if len(hist) > period:
                past_price = hist['Close'].iloc[-period-1]
                ret = ((current_price - past_price) / past_price) * 100
                returns[period] = round(ret, 2)
            else:
                returns[period] = None
        
        return returns
    
    def get_sector_performance(self) -> Dict:
        """모든 섹터의 퍼포먼스 수집"""
        print("\n📊 섹터별 퍼포먼스 수집...")
        print("=" * 60)
        
        results = []
        
        for sector_name, symbol in self.sector_etfs.items():
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                
                # 다양한 기간의 수익률 계산
                returns = self.calculate_returns(ticker, [1, 7, 30, 252])
                
                if returns:
                    hist = ticker.history(period="2d")
                    current_price = hist['Close'].iloc[-1]
                    volume = hist['Volume'].iloc[-1]
                    
                    sector_data = {
                        "name": sector_name,
                        "symbol": symbol,
                        "price": round(current_price, 2),
                        "daily": returns.get(1, 0),
                        "weekly": returns.get(7, 0),
                        "monthly": returns.get(30, 0),
                        "ytd": returns.get(252, 0),
                        "volume": int(volume),
                        "description": info.get("longBusinessSummary", "")[:100],
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    results.append(sector_data)
                    
                    print(f"  ✅ {sector_name:12s} ({symbol}): "
                          f"일간 {returns.get(1, 0):+6.2f}% | "
                          f"주간 {returns.get(7, 0):+6.2f}% | "
                          f"월간 {returns.get(30, 0):+6.2f}%")
            
            except Exception as e:
                print(f"  ❌ {sector_name} ({symbol}) error: {e}")
        
        # 퍼포먼스 순위
        results_sorted = sorted(results, key=lambda x: x['daily'], reverse=True)
        
        print("\n" + "=" * 60)
        print("📈 섹터 퍼포먼스 순위 (일간):")
        for i, sector in enumerate(results_sorted[:5], 1):
            print(f"  {i}. {sector['name']:12s} {sector['daily']:+6.2f}%")
        
        return {
            "sectors": results,
            "top_performer": results_sorted[0] if results_sorted else None,
            "worst_performer": results_sorted[-1] if results_sorted else None
        }
    
    def get_sector_history(self, symbol: str, period: str = "1mo") -> Dict:
        """특정 섹터의 히스토리 데이터"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            if hist.empty:
                return None
            
            # DataFrame을 dict로 변환
            history_data = []
            for index, row in hist.iterrows():
                history_data.append({
                    "date": index.strftime("%Y-%m-%d"),
                    "open": round(row['Open'], 2),
                    "high": round(row['High'], 2),
                    "low": round(row['Low'], 2),
                    "close": round(row['Close'], 2),
                    "volume": int(row['Volume'])
                })
            
            return {
                "symbol": symbol,
                "period": period,
                "data": history_data
            }
        
        except Exception as e:
            print(f"❌ History error for {symbol}: {e}")
            return None
    
    def get_sector_rotation_analysis(self, results: Dict) -> Dict:
        """
        섹터 로테이션 분석
        현재 어떤 섹터가 강세/약세인지 분석
        """
        sectors = results.get("sectors", [])
        
        if not sectors:
            return None
        
        # 일간 수익률 기준으로 상위/하위 분류
        sorted_sectors = sorted(sectors, key=lambda x: x['daily'], reverse=True)
        
        top_3 = sorted_sectors[:3]
        bottom_3 = sorted_sectors[-3:]
        
        # 평균 수익률
        avg_daily = sum(s['daily'] for s in sectors) / len(sectors)
        avg_weekly = sum(s['weekly'] for s in sectors) / len(sectors)
        avg_monthly = sum(s['monthly'] for s in sectors) / len(sectors)
        
        return {
            "strong_sectors": [s['name'] for s in top_3],
            "weak_sectors": [s['name'] for s in bottom_3],
            "average_returns": {
                "daily": round(avg_daily, 2),
                "weekly": round(avg_weekly, 2),
                "monthly": round(avg_monthly, 2)
            },
            "market_breadth": "positive" if avg_daily > 0 else "negative"
        }
    
    def collect_all(self):
        """모든 섹터 데이터 수집"""
        print("\n" + "=" * 60)
        print("🚀 섹터 데이터 수집 시작")
        print("=" * 60)
        
        # 섹터 퍼포먼스
        performance = self.get_sector_performance()
        
        # 섹터 로테이션 분석
        rotation = self.get_sector_rotation_analysis(performance)
        
        if rotation:
            print("\n💡 섹터 로테이션 인사이트:")
            print(f"  강세 섹터: {', '.join(rotation['strong_sectors'])}")
            print(f"  약세 섹터: {', '.join(rotation['weak_sectors'])}")
            print(f"  시장 브레드스: {rotation['market_breadth']}")
        
        print("\n" + "=" * 60)
        print("✅ 섹터 데이터 수집 완료")
        print("=" * 60)
        
        return {
            "performance": performance,
            "rotation": rotation
        }

def main():
    collector = SectorDataCollector()
    data = collector.collect_all()
    
    # TODO: 데이터베이스에 저장

if __name__ == "__main__":
    main()

