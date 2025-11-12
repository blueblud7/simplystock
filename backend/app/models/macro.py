"""
매크로 경제 지표 모델
"""

from sqlalchemy import Column, String, Float, Index, Enum as SQLEnum
from app.models.base import BaseModel
import enum


class IndicatorTypeEnum(str, enum.Enum):
    FEAR_GREED = "fear_greed"
    M2 = "m2"
    INTEREST_RATE = "interest_rate"
    TREASURY_YIELD = "treasury_yield"
    EXCHANGE_RATE = "exchange_rate"
    VIX = "vix"
    DXY = "dxy"
    OTHER = "other"


class MacroIndicator(BaseModel):
    """매크로 경제 지표 모델"""
    
    __tablename__ = "macro_indicators"
    
    # 지표 정보
    name = Column(String(100), nullable=False, index=True)
    type = Column(SQLEnum(IndicatorTypeEnum), nullable=False, index=True)
    
    # 값
    value = Column(Float, nullable=False)
    unit = Column(String(50))  # %, 조 달러, 원 등
    
    # 날짜
    date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    
    # 변동
    change = Column(Float)  # 전일/전월 대비 변동
    change_percent = Column(Float)
    
    # 메타 정보
    source = Column(String(100))  # FRED, Yahoo Finance 등
    metadata = Column(String(500))  # JSON 형태의 추가 정보
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_macro_type_date', 'type', 'date'),
        Index('idx_macro_name_date', 'name', 'date', unique=True),
    )
    
    def __repr__(self):
        return f"<MacroIndicator {self.name}={self.value} {self.unit} on {self.date}>"

