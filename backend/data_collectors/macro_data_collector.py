"""
매크로 경제 지표 수집 스크립트
CNN Fear & Greed Index, M2, 금리, 환율 등을 수집합니다.
"""

import os
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dotenv import load_dotenv
import yfinance as yf

load_dotenv()

class MacroDataCollector:
    def __init__(self):
        self.fred_api_key = os.getenv("FRED_API_KEY")
    
    def get_cnn_fear_greed_index(self) -> Dict:
        """
        CNN Fear & Greed Index 수집
        """
        try:
            # CNN의 공식 API는 없지만, 일부 비공식 API나 스크래핑으로 가능
            # 여기서는 임시 데이터 반환
            print("⚠️ CNN Fear & Greed Index - 비공식 API 사용 필요")
            
            # 대안: Alternative.me Crypto Fear & Greed API (암호화폐용이지만 참고)
            url = "https://api.alternative.me/fng/"
            response = requests.get(url)
            data = response.json()
            
            return {
                "name": "Fear & Greed Index",
                "value": int(data["data"][0]["value"]),
                "classification": data["data"][0]["value_classification"],
                "timestamp": datetime.fromtimestamp(int(data["data"][0]["timestamp"])),
                "source": "Alternative.me (Crypto)"
            }
            
        except Exception as e:
            print(f"❌ Fear & Greed Index error: {e}")
            return None
    
    def get_m2_money_supply(self) -> Dict:
        """
        M2 통화량 (FRED API 사용)
        https://fred.stlouisfed.org/
        """
        if not self.fred_api_key:
            print("⚠️ FRED API key not found")
            return None
        
        try:
            url = f"https://api.stlouisfed.org/fred/series/observations"
            params = {
                "series_id": "M2SL",  # M2 Money Stock
                "api_key": self.fred_api_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 1
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            latest = data["observations"][0]
            
            return {
                "name": "M2 Money Supply",
                "value": float(latest["value"]),
                "unit": "Billions of Dollars",
                "date": latest["date"],
                "source": "Federal Reserve (FRED)"
            }
            
        except Exception as e:
            print(f"❌ M2 Money Supply error: {e}")
            return None
    
    def get_federal_funds_rate(self) -> Dict:
        """
        연준 기준금리 (FRED API)
        """
        if not self.fred_api_key:
            print("⚠️ FRED API key not found")
            return None
        
        try:
            url = f"https://api.stlouisfed.org/fred/series/observations"
            params = {
                "series_id": "FEDFUNDS",  # Federal Funds Effective Rate
                "api_key": self.fred_api_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 1
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            latest = data["observations"][0]
            
            return {
                "name": "Federal Funds Rate",
                "value": float(latest["value"]),
                "unit": "Percent",
                "date": latest["date"],
                "source": "Federal Reserve (FRED)"
            }
            
        except Exception as e:
            print(f"❌ Federal Funds Rate error: {e}")
            return None
    
    def get_treasury_yields(self) -> Dict:
        """
        미국 국채 수익률 (10년물, 2년물)
        """
        try:
            # Yahoo Finance를 통해 국채 수익률 가져오기
            ten_year = yf.Ticker("^TNX")  # 10-Year Treasury
            two_year = yf.Ticker("^IRX")  # 13-Week Treasury Bill
            
            ten_year_data = ten_year.history(period="1d")
            two_year_data = two_year.history(period="1d")
            
            return {
                "10_year": {
                    "name": "10-Year Treasury Yield",
                    "value": ten_year_data["Close"].iloc[-1] if not ten_year_data.empty else None,
                    "unit": "Percent",
                },
                "2_year": {
                    "name": "2-Year Treasury Yield",
                    "value": two_year_data["Close"].iloc[-1] if not two_year_data.empty else None,
                    "unit": "Percent",
                }
            }
            
        except Exception as e:
            print(f"❌ Treasury Yields error: {e}")
            return None
    
    def get_exchange_rates(self) -> Dict:
        """
        환율 (USD/KRW, DXY 달러 인덱스)
        """
        try:
            # USD/KRW
            usdkrw = yf.Ticker("KRW=X")
            usdkrw_data = usdkrw.history(period="1d")
            
            # DXY (Dollar Index)
            dxy = yf.Ticker("DX-Y.NYB")
            dxy_data = dxy.history(period="1d")
            
            return {
                "usd_krw": {
                    "name": "USD/KRW",
                    "value": usdkrw_data["Close"].iloc[-1] if not usdkrw_data.empty else None,
                    "change": usdkrw_data["Close"].iloc[-1] - usdkrw_data["Open"].iloc[-1] if not usdkrw_data.empty else None,
                },
                "dxy": {
                    "name": "DXY (Dollar Index)",
                    "value": dxy_data["Close"].iloc[-1] if not dxy_data.empty else None,
                    "change": dxy_data["Close"].iloc[-1] - dxy_data["Open"].iloc[-1] if not dxy_data.empty else None,
                }
            }
            
        except Exception as e:
            print(f"❌ Exchange Rates error: {e}")
            return None
    
    def get_vix_index(self) -> Dict:
        """
        VIX 변동성 지수
        """
        try:
            vix = yf.Ticker("^VIX")
            vix_data = vix.history(period="1d")
            
            if not vix_data.empty:
                value = vix_data["Close"].iloc[-1]
                change = vix_data["Close"].iloc[-1] - vix_data["Open"].iloc[-1]
                
                # VIX 해석
                if value < 12:
                    status = "Very Low"
                elif value < 20:
                    status = "Low"
                elif value < 30:
                    status = "Medium"
                else:
                    status = "High"
                
                return {
                    "name": "VIX Volatility Index",
                    "value": value,
                    "change": change,
                    "status": status,
                    "date": vix_data.index[-1].strftime("%Y-%m-%d")
                }
            
            return None
            
        except Exception as e:
            print(f"❌ VIX Index error: {e}")
            return None
    
    def collect_all(self) -> Dict:
        """
        모든 매크로 지표 수집
        """
        print("\n🌍 매크로 지표 수집 시작...")
        print("=" * 60)
        
        results = {}
        
        # 1. CNN Fear & Greed Index
        print("\n1️⃣ Fear & Greed Index...")
        results["fear_greed"] = self.get_cnn_fear_greed_index()
        
        # 2. M2 통화량
        print("\n2️⃣ M2 Money Supply...")
        results["m2"] = self.get_m2_money_supply()
        
        # 3. 연준 기준금리
        print("\n3️⃣ Federal Funds Rate...")
        results["fed_funds_rate"] = self.get_federal_funds_rate()
        
        # 4. 국채 수익률
        print("\n4️⃣ Treasury Yields...")
        results["treasury_yields"] = self.get_treasury_yields()
        
        # 5. 환율
        print("\n5️⃣ Exchange Rates...")
        results["exchange_rates"] = self.get_exchange_rates()
        
        # 6. VIX
        print("\n6️⃣ VIX Index...")
        results["vix"] = self.get_vix_index()
        
        print("\n" + "=" * 60)
        print("✅ 매크로 지표 수집 완료")
        
        return results

def main():
    collector = MacroDataCollector()
    data = collector.collect_all()
    
    # 결과 출력
    print("\n" + "=" * 60)
    print("📊 수집된 매크로 지표:")
    print("=" * 60)
    
    for key, value in data.items():
        if value:
            print(f"\n{key.upper()}:")
            print(f"  {value}")
    
    # TODO: 데이터베이스에 저장

if __name__ == "__main__":
    main()

