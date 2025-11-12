"""
모든 데이터 수집 스크립트를 실행하는 통합 스크립트
"""

import asyncio
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(str(Path(__file__).parent.parent))

from data_collectors.news_collector import NewsCollector
from data_collectors.macro_data_collector import MacroDataCollector
from data_collectors.market_data_collector import MarketDataCollector
from data_collectors.sector_data_collector import SectorDataCollector

async def run_all_collectors():
    """모든 데이터 수집기를 순차적으로 실행"""
    
    print("=" * 80)
    print("🚀 SimplyStock 데이터 수집 시작")
    print("=" * 80)
    
    try:
        # 1. 시장 데이터
        print("\n" + "=" * 80)
        print("1️⃣ 시장 데이터 수집")
        print("=" * 80)
        market_collector = MarketDataCollector()
        market_data = market_collector.collect_all()
        
        # 2. 섹터 데이터
        print("\n" + "=" * 80)
        print("2️⃣ 섹터 데이터 수집")
        print("=" * 80)
        sector_collector = SectorDataCollector()
        sector_data = sector_collector.collect_all()
        
        # 3. 매크로 지표
        print("\n" + "=" * 80)
        print("3️⃣ 매크로 지표 수집")
        print("=" * 80)
        macro_collector = MacroDataCollector()
        macro_data = macro_collector.collect_all()
        
        # 4. 뉴스
        print("\n" + "=" * 80)
        print("4️⃣ 뉴스 수집")
        print("=" * 80)
        news_collector = NewsCollector()
        news_data = await news_collector.collect_and_process()
        
        # 결과 요약
        print("\n" + "=" * 80)
        print("✅ 모든 데이터 수집 완료!")
        print("=" * 80)
        print("\n📊 수집 결과:")
        print(f"  • 시장 데이터: {len(market_data.get('indices', {}))}개 지수")
        print(f"  • 섹터 데이터: {len(sector_data.get('performance', {}).get('sectors', []))}개 섹터")
        print(f"  • 매크로 지표: {len([k for k, v in macro_data.items() if v])}개 지표")
        print(f"  • 뉴스: {len(news_data)}개 기사")
        
        print("\n💡 다음 단계:")
        print("  1. 데이터베이스 스키마 설계")
        print("  2. 수집된 데이터를 DB에 저장")
        print("  3. Celery로 주기적 수집 자동화")
        print("  4. FastAPI 엔드포인트와 연동")
        
        return {
            "market": market_data,
            "sectors": sector_data,
            "macro": macro_data,
            "news": news_data,
        }
        
    except Exception as e:
        print(f"\n❌ 에러 발생: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(run_all_collectors())

