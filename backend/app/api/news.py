from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.services.external_data_service import ExternalDataService

router = APIRouter()

# Response Models
class NewsArticle(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    content: Optional[str] = None
    source: str
    author: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    published_at: datetime
    sentiment: Optional[str] = "neutral"  # positive, negative, neutral
    sentiment_score: Optional[float] = 0.0
    tickers: List[str] = []
    category: Optional[str] = "general"  # earnings, m&a, policy, tech, etc.

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
    뉴스 목록 조회 (QuickNews DB에서 실제 데이터 가져오기)
    - source: 뉴스 소스 필터
    - sentiment: 감성 분석 결과 필터 (positive, negative, neutral)
    - ticker: 종목 티커 필터
    - category: 카테고리 필터
    """
    # 실제 DB에서 뉴스 가져오기
    try:
        # 전체 뉴스 개수 조회
        total_count = ExternalDataService.get_news_count(source=source)
        
        # 페이징된 뉴스 가져오기
        offset = (page - 1) * page_size
        news_data = ExternalDataService.get_news(
            limit=page_size,
            offset=offset,
            source=source
        )
        
        # 응답 형식으로 변환
        articles = []
        for news_item in news_data:
            articles.append(NewsArticle(
                id=str(news_item["id"]),
                title=news_item["title"],
                summary=news_item["title"],  # 요약이 없으면 제목 사용
                source=news_item["source"],
                url=news_item["link"],
                published_at=datetime.fromisoformat(news_item["sent_at"]) if news_item["sent_at"] else datetime.now(),
                sentiment="neutral",
                sentiment_score=0.0,
                tickers=[],
                category="general"
            ))
        
        return NewsResponse(
            articles=articles,
            total=total_count,
            page=page,
            page_size=page_size
        )
    except Exception as e:
        # 에러 발생 시 빈 결과 반환
        print(f"❌ 뉴스 조회 에러: {e}")
        return NewsResponse(
            articles=[],
            total=0,
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

