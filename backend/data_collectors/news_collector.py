"""
뉴스 수집 스크립트
다양한 소스에서 금융 뉴스를 수집하고 AI로 요약/분석합니다.
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import openai

load_dotenv()

class NewsCollector:
    def __init__(self):
        self.newsapi_key = os.getenv("NEWSAPI_KEY")
        self.finnhub_key = os.getenv("FINNHUB_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        
        if self.openai_key:
            openai.api_key = self.openai_key
    
    def collect_from_newsapi(self, query: str = "stock market", page_size: int = 20) -> List[Dict]:
        """
        NewsAPI에서 뉴스 수집
        https://newsapi.org/
        """
        if not self.newsapi_key:
            print("⚠️ NewsAPI key not found")
            return []
        
        url = "https://newsapi.org/v2/everything"
        
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": page_size,
            "apiKey": self.newsapi_key
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            articles = []
            for article in data.get("articles", []):
                articles.append({
                    "title": article.get("title"),
                    "description": article.get("description"),
                    "content": article.get("content"),
                    "source": article.get("source", {}).get("name"),
                    "author": article.get("author"),
                    "url": article.get("url"),
                    "image_url": article.get("urlToImage"),
                    "published_at": article.get("publishedAt"),
                })
            
            print(f"✅ NewsAPI: {len(articles)} articles collected")
            return articles
            
        except Exception as e:
            print(f"❌ NewsAPI error: {e}")
            return []
    
    def collect_from_finnhub(self, category: str = "general") -> List[Dict]:
        """
        Finnhub에서 금융 뉴스 수집
        https://finnhub.io/
        """
        if not self.finnhub_key:
            print("⚠️ Finnhub key not found")
            return []
        
        url = "https://finnhub.io/api/v1/news"
        
        params = {
            "category": category,
            "token": self.finnhub_key
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            articles = []
            for item in data:
                articles.append({
                    "title": item.get("headline"),
                    "description": item.get("summary"),
                    "source": item.get("source"),
                    "url": item.get("url"),
                    "image_url": item.get("image"),
                    "published_at": datetime.fromtimestamp(item.get("datetime")).isoformat(),
                    "category": item.get("category"),
                })
            
            print(f"✅ Finnhub: {len(articles)} articles collected")
            return articles
            
        except Exception as e:
            print(f"❌ Finnhub error: {e}")
            return []
    
    def collect_from_yahoo_finance_rss(self) -> List[Dict]:
        """
        Yahoo Finance RSS에서 뉴스 수집
        """
        url = "https://finance.yahoo.com/news/rssindex"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'xml')
            items = soup.find_all('item')
            
            articles = []
            for item in items[:20]:  # 최근 20개
                articles.append({
                    "title": item.find('title').text if item.find('title') else None,
                    "description": item.find('description').text if item.find('description') else None,
                    "url": item.find('link').text if item.find('link') else None,
                    "published_at": item.find('pubDate').text if item.find('pubDate') else None,
                    "source": "Yahoo Finance",
                })
            
            print(f"✅ Yahoo Finance RSS: {len(articles)} articles collected")
            return articles
            
        except Exception as e:
            print(f"❌ Yahoo Finance RSS error: {e}")
            return []
    
    def scrape_korean_news(self) -> List[Dict]:
        """
        한국 증권 뉴스 크롤링 (예시: 한국경제)
        주의: 실제 사용 시 robots.txt 확인 및 이용약관 준수 필요
        """
        # 실제 구현 시 각 사이트의 robots.txt와 이용약관을 확인하세요
        print("⚠️ 한국 뉴스 크롤링은 각 사이트의 이용약관을 확인 후 구현하세요")
        return []
    
    async def summarize_with_ai(self, article: Dict) -> Dict:
        """
        OpenAI GPT-4를 사용하여 뉴스 요약 및 감성 분석
        """
        if not self.openai_key:
            print("⚠️ OpenAI key not found")
            return article
        
        content = article.get("content") or article.get("description", "")
        if not content or len(content) < 50:
            return article
        
        try:
            # GPT-4를 사용한 요약 및 감성 분석
            prompt = f"""
다음 금융 뉴스를 분석해주세요:

제목: {article.get('title')}
내용: {content}

다음 형식으로 답변해주세요:
1. 요약 (2-3 문장)
2. 감성 (positive/negative/neutral 중 하나)
3. 감성 점수 (-1.0 ~ 1.0)
4. 관련 주식 티커 (있다면)
5. 카테고리 (earnings/m&a/policy/tech/market 중 하나)
"""
            
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "당신은 금융 뉴스 분석 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
            )
            
            ai_response = response.choices[0].message.content
            
            # AI 응답 파싱 (실제로는 더 정교한 파싱 필요)
            article["ai_summary"] = ai_response
            article["sentiment"] = "neutral"  # 파싱 후 설정
            article["sentiment_score"] = 0.0
            article["tickers"] = []
            article["category"] = "market"
            
            print(f"✅ AI 분석 완료: {article.get('title')[:50]}...")
            
        except Exception as e:
            print(f"❌ AI 분석 에러: {e}")
        
        return article
    
    async def collect_and_process(self):
        """
        모든 소스에서 뉴스 수집 및 처리
        """
        print("\n🔄 뉴스 수집 시작...")
        print("=" * 60)
        
        all_articles = []
        
        # 1. NewsAPI
        articles = self.collect_from_newsapi(query="stock market OR cryptocurrency")
        all_articles.extend(articles)
        
        # 2. Finnhub
        articles = self.collect_from_finnhub(category="general")
        all_articles.extend(articles)
        
        # 3. Yahoo Finance RSS
        articles = self.collect_from_yahoo_finance_rss()
        all_articles.extend(articles)
        
        print("\n" + "=" * 60)
        print(f"📊 총 {len(all_articles)}개 뉴스 수집 완료")
        
        # AI 분석 (선택적)
        if self.openai_key and all_articles:
            print("\n🤖 AI 분석 시작...")
            # 처음 5개만 분석 (비용 절감)
            for article in all_articles[:5]:
                await self.summarize_with_ai(article)
        
        # TODO: 데이터베이스에 저장
        print("\n💾 데이터베이스 저장 (구현 예정)")
        
        return all_articles

async def main():
    collector = NewsCollector()
    articles = await collector.collect_and_process()
    
    # 결과 출력
    print("\n" + "=" * 60)
    print("📰 수집된 뉴스 샘플:")
    print("=" * 60)
    for i, article in enumerate(articles[:3], 1):
        print(f"\n{i}. {article.get('title')}")
        print(f"   소스: {article.get('source')}")
        print(f"   URL: {article.get('url')}")

if __name__ == "__main__":
    asyncio.run(main())

