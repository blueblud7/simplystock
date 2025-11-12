"""
뉴스 모델
"""

from sqlalchemy import Column, String, Text, Float, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class SentimentEnum(str, enum.Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class CategoryEnum(str, enum.Enum):
    EARNINGS = "earnings"
    MA = "m&a"
    POLICY = "policy"
    TECH = "tech"
    MARKET = "market"
    OTHER = "other"


class News(BaseModel):
    """뉴스 기사 모델"""
    
    __tablename__ = "news"
    
    # 기본 정보
    title = Column(String(500), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    content = Column(Text)
    url = Column(String(1000), unique=True, nullable=False, index=True)
    image_url = Column(String(1000))
    
    # 출처 정보
    source = Column(String(100), nullable=False, index=True)
    author = Column(String(200))
    published_at = Column(String(100), nullable=False, index=True)  # ISO 8601 형식
    
    # AI 분석 결과
    sentiment = Column(SQLEnum(SentimentEnum), default=SentimentEnum.NEUTRAL, index=True)
    sentiment_score = Column(Float, default=0.0)  # -1.0 ~ 1.0
    ai_summary = Column(Text)  # GPT-4o-mini가 생성한 요약
    
    # 분류
    category = Column(SQLEnum(CategoryEnum), default=CategoryEnum.OTHER, index=True)
    region = Column(String(10), index=True)  # US, KR, EU, CN 등
    
    # 관계
    tags = relationship("NewsTag", back_populates="news", cascade="all, delete-orphan")
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_news_sentiment_published', 'sentiment', 'published_at'),
        Index('idx_news_category_published', 'category', 'published_at'),
        Index('idx_news_source_published', 'source', 'published_at'),
    )
    
    def __repr__(self):
        return f"<News {self.id}: {self.title[:50]}...>"


class NewsTag(BaseModel):
    """뉴스-태그 관계 테이블 (다대다)"""
    
    __tablename__ = "news_tags"
    
    news_id = Column(ForeignKey("news.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id = Column(ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 관계
    news = relationship("News", back_populates="tags")
    tag = relationship("Tag", back_populates="news_items")
    
    # 복합 인덱스 (중복 방지)
    __table_args__ = (
        Index('idx_news_tag_unique', 'news_id', 'tag_id', unique=True),
    )
    
    def __repr__(self):
        return f"<NewsTag news_id={self.news_id}, tag_id={self.tag_id}>"

