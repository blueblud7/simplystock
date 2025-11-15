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

## 8️⃣ 52주 신고가/신저가 API

### 📊 데이터 소스

**분석 대상:**
- **S&P 500**: 미국 대형주 500개 종목 (Wikipedia API)
- **NASDAQ 100**: 나스닥 상장 대형 기술주 100개 (Wikipedia API)
- **추가 주요 종목**: Russell, Dow Jones 등에서 선별한 60개
- **총 분석 대상**: 약 600개 종목 (중복 제거 후 실제 수집: ~200개)

**업데이트 주기:**
- 자동 갱신: 15분마다
- 수동 갱신: `POST /api/52week/refresh`

### API 엔드포인트

#### 1. 52주 신고가 종목 조회
```http
GET /api/52week/highs?limit=20&market_cap=Mega
```

**Parameters:**
- `limit` (int): 반환할 종목 수 (기본 20, 최대 100)
- `market_cap` (string, optional): 시총 필터
  - `Mega`: 대형주 (시총 200B$ 이상)
  - `Large`: 대형주 (시총 10B$ ~ 200B$)
  - `Mid`: 중형주 (시총 2B$ ~ 10B$)
  - `Small`: 소형주 (시총 2B$ 미만)

**Response:**
```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 272.41,
      "high_52week": 277.32,
      "change": -0.54,
      "change_percent": -0.2,
      "sector": "Technology",
      "market_cap": 4.03,
      "market_cap_category": "대형주 (Mega Cap)"
    }
  ],
  "total": 16
}
```

#### 2. 52주 신저가 종목 조회
```http
GET /api/52week/lows?limit=20&market_cap=Large
```

동일한 파라미터와 응답 구조

#### 3. 전체 통계
```http
GET /api/52week/stats
```

**Response:**
```json
{
  "highs_count": 16,
  "lows_count": 8,
  "ratio": 2.0,
  "market_breadth": "positive",
  "total_stocks": 166,
  "last_update": "2025-11-14T20:48:50.974435"
}
```

**Market Breadth 분류:**
- `strong`: ratio > 2.5 (매우 강세)
- `positive`: ratio > 1.5 (긍정적)
- `neutral`: ratio > 0.7 (중립)
- `weak`: ratio ≤ 0.7 (약세)

#### 4. 시총별 통계
```http
GET /api/52week/stats/by-market-cap
```

**Response:**
```json
[
  {
    "category": "대형주 (Mega Cap)",
    "highs_count": 5,
    "lows_count": 1,
    "ratio": 5.0,
    "total_stocks": 50
  },
  {
    "category": "대형주 (Large Cap)",
    "highs_count": 11,
    "lows_count": 7,
    "ratio": 1.57,
    "total_stocks": 116
  }
]
```

#### 5. 52주 신고가/신저가 추이 (히스토리)
```http
GET /api/52week/history?days=30
```

**Parameters:**
- `days` (int): 조회할 일수 (기본 30일, 최대 365일)

**Response:**
```json
{
  "history": [
    {
      "date": "2025-11-08",
      "highs_count": 18,
      "lows_count": 9,
      "ratio": 2.0,
      "market_breadth": "positive"
    },
    {
      "date": "2025-11-09",
      "highs_count": 16,
      "lows_count": 8,
      "ratio": 2.0,
      "market_breadth": "positive"
    }
  ],
  "days": 30,
  "note": "현재는 추정 데이터입니다. 실제 히스토리 추적을 위해서는 매일 데이터를 DB에 저장해야 합니다."
}
```

#### 6. 등락 종목 수 (Advance/Decline)
```http
GET /api/52week/advance-decline
```

**Response:**
```json
{
  "advancing": 66,
  "declining": 100,
  "unchanged": 0,
  "total_stocks": 166,
  "ad_ratio": 0.66,
  "market_sentiment": "약세",
  "timestamp": "2025-11-14T20:53:54.747975",
  "note": "총 166개 종목 중 상승 66개, 하락 100개"
}
```

**Market Sentiment 분류:**
- `매우 강세`: ratio > 2
- `강세`: ratio > 1.5
- `약한 강세`: ratio > 1
- `약한 약세`: ratio > 0.67
- `약세`: ratio > 0.5
- `매우 약세`: ratio ≤ 0.5

#### 7. 시장 상태 확인
```http
GET /api/52week/market-status
```

**캘리포니아 시간대 기준으로:**
- 주말 여부 체크 (토요일, 일요일)
- 미국 공휴일 여부 체크 (New Year's, MLK Day, Presidents Day, Good Friday, Memorial Day, Juneteenth, Independence Day, Labor Day, Thanksgiving, Christmas)
- 시장 시간 체크 (06:30-13:00 PST/PDT)
- 직전 거래일 자동 계산

**Response (시장 마감 시):**
```json
{
  "is_open": false,
  "date": "2025-11-13",
  "message": "시장 마감 - 직전 거래일 (2025-11-13) 데이터 표시",
  "california_time": "2025-11-14 21:04:19 PST"
}
```

**Response (주말 시):**
```json
{
  "is_open": false,
  "date": "2025-11-14",
  "message": "주말 - 직전 거래일 (2025-11-14) 데이터 표시",
  "california_time": "2025-11-16 10:00:00 PST"
}
```

**Response (시장 개장 중):**
```json
{
  "is_open": true,
  "date": "2025-11-17",
  "message": "시장 개장 중",
  "california_time": "2025-11-17 09:00:00 PST"
}
```

#### 8. 캐시 강제 새로고침
```http
POST /api/52week/refresh
```

**Response:**
```json
{
  "message": "캐시 업데이트 시작",
  "status": "updating",
  "estimated_time": "30-60초",
  "target_stocks": "S&P 500 + NASDAQ 100 + 추가 주요 종목"
}
```

### 💡 활용 팁

1. **시총별 분석**: 대형주, 중형주, 소형주별로 시장 상황을 다르게 파악할 수 있습니다.
2. **히스토리 추적**: 30일 추이를 통해 시장 모멘텀 변화를 감지할 수 있습니다.
3. **Advance/Decline**: 당일 등락 종목 수로 단기 시장 심리를 파악할 수 있습니다.
4. **52주 신고가/신저가 비율**: 시장 브레드스(Market Breadth)의 핵심 지표입니다.
5. **시장 상태 체크**: 주말이나 공휴일에는 자동으로 직전 거래일 데이터를 표시합니다.

### 🕒 시장 시간 (캘리포니아 기준)

**개장 시간:**
- 월요일 ~ 금요일: 06:30 - 13:00 (PST/PDT)
- 동부 시간: 09:30 - 16:00 (EST/EDT)

**휴장일:**
- 주말 (토요일, 일요일)
- 미국 공휴일 (New Year's Day, MLK Day, Presidents Day, Good Friday, Memorial Day, Juneteenth, Independence Day, Labor Day, Thanksgiving, Christmas)

**직전 거래일 처리:**
- 주말/공휴일에 접속하면 자동으로 직전 거래일 데이터를 표시
- `market_status` 필드에서 현재 상태 확인 가능
- UI에 "직전 거래일 (2025-11-14) 데이터" 같은 안내 표시 가능

---

**질문이 있으시면 언제든 물어보세요!** 🚀

