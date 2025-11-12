# 📡 SimplyStock API 가이드

## 뉴스 API 통합 방법

SimplyStock는 여러 뉴스 소스에서 데이터를 수집하고 AI로 분석합니다.

## 1️⃣ 뉴스 수집 흐름

```
뉴스 소스 → 데이터 수집 → AI 분석 → 데이터베이스 → API → Frontend
```

## 2️⃣ 지원하는 뉴스 소스

### A. NewsAPI (추천)

**특징:**
- 70,000+ 뉴스 소스
- 전 세계 뉴스 커버리지
- 무료: 100 요청/일, 유료: $449/월

**사용 방법:**

```python
# backend/data_collectors/news_collector.py
from newsapi import NewsApiClient

newsapi = NewsApiClient(api_key='YOUR_API_KEY')

# 주식 관련 뉴스 검색
articles = newsapi.get_everything(
    q='stock market',
    language='en',
    sort_by='publishedAt',
    page_size=20
)
```

**등록:** https://newsapi.org/register

---

### B. Finnhub (금융 특화)

**특징:**
- 주식, 암호화폐, 외환 뉴스
- 실시간 업데이트
- 무료 tier 포함

**사용 방법:**

```python
import finnhub

finnhub_client = finnhub.Client(api_key="YOUR_API_KEY")

# 일반 금융 뉴스
news = finnhub_client.general_news('general', min_id=0)

# 특정 종목 뉴스
company_news = finnhub_client.company_news('AAPL', _from="2024-01-01", to="2024-01-31")
```

**등록:** https://finnhub.io/register

---

### C. Alpha Vantage

**특징:**
- 금융 데이터 + 뉴스
- 무료: 5 API 요청/분
- 주식, 외환, 암호화폐

**사용 방법:**

```python
import requests

url = f'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=YOUR_API_KEY'
response = requests.get(url)
data = response.json()
```

**등록:** https://www.alphavantage.co/support/#api-key

---

### D. Yahoo Finance RSS

**특징:**
- 완전 무료
- API 키 불필요
- 한계: 구조화되지 않은 데이터

**사용 방법:**

```python
import feedparser

feed = feedparser.parse('https://finance.yahoo.com/news/rssindex')
for entry in feed.entries:
    print(entry.title, entry.link)
```

---

### E. 한국 증권 뉴스 (크롤링)

**주의사항:**
- robots.txt 확인 필수
- 이용약관 준수
- 법적 책임 고려

**추천 소스:**
- 한국경제: https://www.hankyung.com/
- 매일경제: https://www.mk.co.kr/
- 네이버 금융: https://finance.naver.com/
- 다음 금융: https://finance.daum.net/

**예시 (BeautifulSoup):**

```python
import requests
from bs4 import BeautifulSoup

# 주의: 실제 사용 전 해당 사이트 이용약관 확인 필요
url = "https://www.hankyung.com/economy"
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

# 뉴스 제목 파싱 (사이트마다 다름)
titles = soup.select('.news-title')
for title in titles:
    print(title.text)
```

---

## 3️⃣ AI 분석 (OpenAI GPT-4)

뉴스를 수집한 후 AI로 요약 및 감성 분석:

```python
import openai

openai.api_key = "YOUR_OPENAI_KEY"

def analyze_news(article):
    prompt = f"""
다음 금융 뉴스를 분석해주세요:

제목: {article['title']}
내용: {article['content']}

다음 형식으로 답변:
1. 한 줄 요약
2. 감성 (positive/negative/neutral)
3. 관련 주식 티커
"""
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "당신은 금융 뉴스 분석가입니다."},
            {"role": "user", "content": prompt}
        ]
    )
    
    return response.choices[0].message.content
```

---

## 4️⃣ 데이터 흐름 상세

### 수집 (Collector)

```python
# backend/data_collectors/news_collector.py

class NewsCollector:
    async def collect_and_process(self):
        # 1. 여러 소스에서 수집
        articles = []
        articles.extend(self.collect_from_newsapi())
        articles.extend(self.collect_from_finnhub())
        articles.extend(self.collect_from_yahoo_rss())
        
        # 2. AI 분석
        for article in articles:
            await self.summarize_with_ai(article)
        
        # 3. 데이터베이스 저장
        await self.save_to_database(articles)
        
        return articles
```

### 스케줄링 (Celery)

```python
# backend/app/tasks.py

from celery import Celery
from celery.schedules import crontab

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def collect_news():
    """매 시간마다 뉴스 수집"""
    collector = NewsCollector()
    asyncio.run(collector.collect_and_process())

# 스케줄 설정
celery.conf.beat_schedule = {
    'collect-news-hourly': {
        'task': 'app.tasks.collect_news',
        'schedule': crontab(minute=0),  # 매 시간 정각
    },
}
```

### API 엔드포인트

```python
# backend/app/api/news.py

@router.get("/")
async def get_news(
    page: int = 1,
    page_size: int = 20,
    sentiment: Optional[str] = None,
):
    """뉴스 목록 조회"""
    # 데이터베이스에서 조회
    articles = await db.query(News).filter(
        News.sentiment == sentiment if sentiment else True
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    return {"articles": articles, "total": len(articles)}
```

### Frontend 사용

```typescript
// frontend/lib/api.ts

export async function getNews(params?: {
  page?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}) {
  const url = new URL(`${API_URL}/api/news`);
  if (params?.page) url.searchParams.set('page', params.page.toString());
  if (params?.sentiment) url.searchParams.set('sentiment', params.sentiment);
  
  const response = await fetch(url.toString());
  return response.json();
}
```

---

## 5️⃣ 비용 최적화

### 무료 API 조합

```
NewsAPI (100/일) + Finnhub (무료) + Yahoo RSS (무제한) = 충분한 뉴스
```

### 캐싱 전략

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_news_cached(cache_key: str, expire_seconds: int = 3600):
    """1시간 동안 뉴스 캐싱"""
    cached = redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    # 캐시 없으면 새로 수집
    articles = collect_news()
    redis_client.setex(cache_key, expire_seconds, json.dumps(articles))
    
    return articles
```

---

## 6️⃣ 추천 아키텍처

```
┌─────────────────┐
│  뉴스 소스들     │
│  (API/RSS/크롤)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Celery Worker   │ ← 주기적 수집
│ (매 시간)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI 분석 (GPT-4) │
│ - 요약           │
│ - 감성 분석      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL      │
│ + Redis Cache   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FastAPI         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Next.js Frontend│
└─────────────────┘
```

---

## 7️⃣ 실행 명령어

```bash
# 1회성 수집
cd backend
python data_collectors/news_collector.py

# 모든 데이터 수집
python data_collectors/run_all_collectors.py

# Celery로 자동 수집
celery -A app.tasks worker --loglevel=info
celery -A app.tasks beat --loglevel=info
```

---

**질문이 있으시면 언제든 물어보세요!** 🚀

