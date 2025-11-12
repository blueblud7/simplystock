"""
태그 모델
"""

from sqlalchemy import Column, String, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class TagTypeEnum(str, enum.Enum):
    SECTOR = "sector"  # 섹터 (기술, 금융 등)
    TICKER = "ticker"  # 종목 심볼 (AAPL, MSFT 등)
    CATEGORY = "category"  # 카테고리 (earnings, m&a 등)
    SENTIMENT = "sentiment"  # 감성 (positive, negative 등)
    REGION = "region"  # 지역 (US, KR 등)
    KEYWORD = "keyword"  # 키워드 (AI, 반도체 등)


class Tag(BaseModel):
    """태그 모델 (모든 컨텐츠에 적용 가능)"""
    
    __tablename__ = "tags"
    
    # 태그 정보
    name = Column(String(100), nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # URL 친화적 이름
    type = Column(SQLEnum(TagTypeEnum), nullable=False, index=True)
    
    # 메타 정보
    description = Column(String(500))
    color = Column(String(20))  # UI 표시용 색상 코드
    
    # 통계
    usage_count = Column(Integer, default=0)  # 사용 횟수 (캐시 무효화 시 계산)
    
    # 관계
    news_items = relationship("NewsTag", back_populates="tag", cascade="all, delete-orphan")
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_tag_type_name', 'type', 'name', unique=True),
        Index('idx_tag_usage_count', 'usage_count'),
    )
    
    def __repr__(self):
        return f"<Tag {self.name} ({self.type})>"
    
    @classmethod
    def create_slug(cls, name: str) -> str:
        """태그 이름으로부터 슬러그 생성"""
        import re
        # 소문자 변환, 공백을 하이픈으로, 특수문자 제거
        slug = name.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug

