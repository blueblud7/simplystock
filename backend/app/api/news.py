from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter()

# Response Models
class NewsArticle(BaseModel):
    id: str
    title: str
    summary: str
    content: Optional[str] = None
    source: str
    author: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    published_at: datetime
    sentiment: str  # positive, negative, neutral
    sentiment_score: float
    tickers: List[str] = []
    category: str  # earnings, m&a, policy, tech, etc.

class NewsResponse(BaseModel):
    articles: List[NewsArticle]
    total: int
    page: int
    page_size: int

@router.get("/", response_model=NewsResponse)
async def get_news(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    source: Optional[str] = None,
    sentiment: Optional[str] = None,
    ticker: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """
    뉴스 목록 조회
    - source: 뉴스 소스 필터
    - sentiment: 감성 분석 결과 필터 (positive, negative, neutral)
    - ticker: 종목 티커 필터
    - category: 카테고리 필터
    """
    # TODO: 실제 데이터베이스에서 조회
    # 임시 데이터
    articles = [
        NewsArticle(
            id="1",
            title="연준, 기준금리 동결 결정...인플레이션 압력 완화",
            summary="연방준비제도가 기준금리를 5.25-5.50%로 유지하기로 결정했습니다.",
            source="Bloomberg",
            url="https://example.com/news/1",
            published_at=datetime.now() - timedelta(hours=2),
            sentiment="neutral",
            sentiment_score=0.05,
            tickers=["SPY", "QQQ"],
            category="policy"
        ),
        NewsArticle(
            id="2",
            title="엔비디아, AI 칩 수요 급증으로 매출 전망 상향",
            summary="엔비디아가 데이터센터용 AI 칩의 수요 급증으로 다음 분기 매출 전망을 상향 조정했습니다.",
            source="CNBC",
            url="https://example.com/news/2",
            published_at=datetime.now() - timedelta(hours=4),
            sentiment="positive",
            sentiment_score=0.85,
            tickers=["NVDA"],
            category="earnings"
        ),
    ]
    
    return NewsResponse(
        articles=articles,
        total=len(articles),
        page=page,
        page_size=page_size
    )

@router.get("/{news_id}", response_model=NewsArticle)
async def get_news_detail(news_id: str):
    """특정 뉴스 상세 조회"""
    # TODO: 실제 데이터베이스에서 조회
    raise HTTPException(status_code=404, detail="News not found")

@router.get("/summary/daily")
async def get_daily_summary():
    """
    AI가 생성한 일일 시장 요약
    """
    return {
        "date": datetime.now().date(),
        "summary": "오늘 시장은 연준의 금리 동결 결정에 긍정적으로 반응했습니다. 기술주를 중심으로 상승세를 보였으며...",
        "key_points": [
            "연준 기준금리 5.25-5.50% 동결",
            "나스닥 1.2% 상승, S&P 500 0.8% 상승",
            "엔비디아 주가 3.5% 급등",
        ],
        "sentiment": "positive",
        "market_mood": "낙관적"
    }

@router.get("/trending/topics")
async def get_trending_topics():
    """
    현재 트렌딩 토픽
    """
    return {
        "topics": [
            {"name": "AI 반도체", "count": 45, "sentiment": "positive"},
            {"name": "금리 정책", "count": 38, "sentiment": "neutral"},
            {"name": "전기차", "count": 29, "sentiment": "negative"},
            {"name": "빅테크 실적", "count": 24, "sentiment": "positive"},
        ]
    }

