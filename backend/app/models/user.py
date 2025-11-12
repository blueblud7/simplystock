"""
사용자 및 포트폴리오 모델
"""

from sqlalchemy import Column, String, Boolean, Float, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class User(BaseModel):
    """사용자 모델"""
    
    __tablename__ = "users"
    
    # 기본 정보
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # 프로필
    full_name = Column(String(200))
    avatar_url = Column(String(500))
    
    # 상태
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    
    # 관계
    portfolios = relationship("UserPortfolio", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username} ({self.email})>"


class UserPortfolio(BaseModel):
    """사용자 포트폴리오 모델"""
    
    __tablename__ = "user_portfolios"
    
    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 포트폴리오 정보
    name = Column(String(200), nullable=False)
    description = Column(String(1000))
    
    # 통계
    total_value = Column(Float, default=0.0)
    total_return = Column(Float, default=0.0)
    total_return_percent = Column(Float, default=0.0)
    
    # 관계
    user = relationship("User", back_populates="portfolios")
    holdings = relationship("PortfolioHolding", back_populates="portfolio", cascade="all, delete-orphan")
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_portfolio_user_name', 'user_id', 'name'),
    )
    
    def __repr__(self):
        return f"<UserPortfolio {self.name} (user_id={self.user_id})>"


class PortfolioHolding(BaseModel):
    """포트폴리오 보유 종목 모델"""
    
    __tablename__ = "portfolio_holdings"
    
    portfolio_id = Column(ForeignKey("user_portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    stock_id = Column(ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 보유 정보
    quantity = Column(Float, nullable=False)  # 보유 수량
    average_price = Column(Float, nullable=False)  # 평균 매입가
    
    # 계산된 값 (캐시)
    current_value = Column(Float)  # 현재 가치
    profit_loss = Column(Float)  # 손익
    profit_loss_percent = Column(Float)  # 손익률
    
    # 관계
    portfolio = relationship("UserPortfolio", back_populates="holdings")
    stock = relationship("Stock")
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_holding_portfolio_stock', 'portfolio_id', 'stock_id', unique=True),
    )
    
    def __repr__(self):
        return f"<PortfolioHolding portfolio_id={self.portfolio_id}, stock_id={self.stock_id}, qty={self.quantity}>"

