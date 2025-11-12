"""
SQLAlchemy Base 모델
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import declared_attr

Base = declarative_base()


class TimestampMixin:
    """생성/수정 시간 자동 추가 Mixin"""
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class BaseModel(Base, TimestampMixin):
    """모든 모델의 기본 클래스"""
    
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    
    @declared_attr
    def __tablename__(cls):
        """테이블명 자동 생성 (클래스명의 소문자 + s)"""
        return cls.__name__.lower() + 's'
    
    def to_dict(self):
        """모델을 dict로 변환"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

