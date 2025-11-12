"""
주식 모델
"""

from sqlalchemy import Column, String, Float, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Stock(BaseModel):
    """종목 정보 모델"""
    
    __tablename__ = "stocks"
    
    # 기본 정보
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    sector = Column(String(50), index=True)
    market_cap = Column(Float)  # 시가총액 (단위: 조)
    
    # 현재 가격
    current_price = Column(Float)
    change = Column(Float)  # 전일 대비 변동
    change_percent = Column(Float)  # 전일 대비 변동률
    volume = Column(Float)  # 거래량
    
    # 52주 고저
    high_52week = Column(Float, index=True)
    low_52week = Column(Float, index=True)
    is_at_52week_high = Column(Boolean, default=False, index=True)
    is_at_52week_low = Column(Boolean, default=False, index=True)
    days_at_high = Column(Integer, default=0)
    days_at_low = Column(Integer, default=0)
    
    # 추가 정보
    region = Column(String(10), index=True)  # US, KR 등
    exchange = Column(String(20))  # NASDAQ, NYSE, KRX 등
    
    # 관계
    price_history = relationship("StockPrice", back_populates="stock", cascade="all, delete-orphan")
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_stock_sector_symbol', 'sector', 'symbol'),
        Index('idx_stock_52week_high', 'is_at_52week_high', 'high_52week'),
        Index('idx_stock_52week_low', 'is_at_52week_low', 'low_52week'),
    )
    
    def __repr__(self):
        return f"<Stock {self.symbol}: {self.name}>"


class StockPrice(BaseModel):
    """주가 히스토리 모델"""
    
    __tablename__ = "stock_prices"
    
    stock_id = Column(ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # OHLCV 데이터
    date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    
    # 관계
    stock = relationship("Stock", back_populates="price_history")
    
    # 복합 인덱스 (종목별 날짜 조회 최적화)
    __table_args__ = (
        Index('idx_stock_price_stock_date', 'stock_id', 'date', unique=True),
    )
    
    def __repr__(self):
        return f"<StockPrice stock_id={self.stock_id}, date={self.date}, close={self.close}>"

