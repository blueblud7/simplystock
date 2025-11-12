"""
섹터 모델
"""

from sqlalchemy import Column, String, Float, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Sector(BaseModel):
    """섹터 정보 모델"""
    
    __tablename__ = "sectors"
    
    # 기본 정보
    name = Column(String(50), unique=True, nullable=False, index=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True)  # ETF 심볼 (XLK, XLF 등)
    description = Column(String(500))
    
    # 관계
    performance_history = relationship("SectorPerformance", back_populates="sector", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Sector {self.name} ({self.symbol})>"


class SectorPerformance(BaseModel):
    """섹터 퍼포먼스 히스토리"""
    
    __tablename__ = "sector_performances"
    
    sector_id = Column(ForeignKey("sectors.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 날짜
    date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    
    # 수익률
    daily = Column(Float, nullable=False)
    weekly = Column(Float)
    monthly = Column(Float)
    ytd = Column(Float)  # Year-to-date
    
    # 가격 및 거래량
    price = Column(Float, nullable=False)
    volume = Column(Float)
    
    # 관계
    sector = relationship("Sector", back_populates="performance_history")
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_sector_perf_sector_date', 'sector_id', 'date', unique=True),
        Index('idx_sector_perf_date_daily', 'date', 'daily'),
    )
    
    def __repr__(self):
        return f"<SectorPerformance sector_id={self.sector_id}, date={self.date}, daily={self.daily}%>"

