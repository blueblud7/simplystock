"""
데이터베이스 연결 설정
여러 DB 엔진을 관리합니다.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
import os
from pathlib import Path

# 상위 폴더 경로 (SimplyStock의 상위 폴더가 Vibe)
# __file__: .../Vibe/SimplyStock/backend/app/database.py
# parent.parent.parent.parent: .../Vibe
VIBE_DIR = Path(__file__).parent.parent.parent.parent

# SQLite DB 경로
REPORTS_DB_PATH = VIBE_DIR / "report" / "reports.db"
NEWS_DB_PATH = VIBE_DIR / "QuickNews" / "news.db"

# PostgreSQL (SimplyStock 자체 DB - 선택적)
SIMPLYSTOCK_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./simplystock.db"  # 기본값: 로컬 SQLite
)

# 엔진 생성
engine_reports = create_engine(
    f"sqlite:///{REPORTS_DB_PATH}",
    connect_args={"check_same_thread": False},
    echo=False
)

engine_news = create_engine(
    f"sqlite:///{NEWS_DB_PATH}",
    connect_args={"check_same_thread": False},
    echo=False
)

engine_main = create_engine(
    SIMPLYSTOCK_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SIMPLYSTOCK_DATABASE_URL else {},
    echo=False
)

# 세션 팩토리
SessionReports = sessionmaker(autocommit=False, autoflush=False, bind=engine_reports)
SessionNews = sessionmaker(autocommit=False, autoflush=False, bind=engine_news)
SessionMain = sessionmaker(autocommit=False, autoflush=False, bind=engine_main)


# Context Managers
@contextmanager
def get_reports_db():
    """증권사 리포트 DB 세션"""
    session = SessionReports()
    try:
        yield session
    finally:
        session.close()


@contextmanager
def get_news_db():
    """뉴스 DB 세션"""
    session = SessionNews()
    try:
        yield session
    finally:
        session.close()


@contextmanager
def get_main_db():
    """SimplyStock 메인 DB 세션"""
    session = SessionMain()
    try:
        yield session
    finally:
        session.close()


# Dependency Injection (FastAPI용)
def get_reports_db_dependency():
    """FastAPI Dependency: 리포트 DB"""
    with get_reports_db() as session:
        yield session


def get_news_db_dependency():
    """FastAPI Dependency: 뉴스 DB"""
    with get_news_db() as session:
        yield session


def get_main_db_dependency():
    """FastAPI Dependency: 메인 DB"""
    with get_main_db() as session:
        yield session


# 연결 테스트
def test_connections():
    """모든 DB 연결 테스트"""
    results = {}
    
    # Reports DB
    try:
        with get_reports_db() as session:
            result = session.execute(text("SELECT COUNT(*) FROM sent_reports")).scalar()
            results["reports_db"] = {
                "status": "✅ Connected",
                "reports_count": result,
                "path": str(REPORTS_DB_PATH)
            }
    except Exception as e:
        results["reports_db"] = {
            "status": "❌ Failed",
            "error": str(e),
            "path": str(REPORTS_DB_PATH)
        }
    
    # News DB
    try:
        with get_news_db() as session:
            result = session.execute(text("SELECT COUNT(*) FROM news")).scalar()
            results["news_db"] = {
                "status": "✅ Connected",
                "news_count": result,
                "path": str(NEWS_DB_PATH)
            }
    except Exception as e:
        results["news_db"] = {
            "status": "❌ Failed",
            "error": str(e),
            "path": str(NEWS_DB_PATH)
        }
    
    return results


if __name__ == "__main__":
    """테스트 실행"""
    print("\n🔌 데이터베이스 연결 테스트\n" + "=" * 60)
    
    results = test_connections()
    
    for db_name, info in results.items():
        print(f"\n📊 {db_name}:")
        for key, value in info.items():
            print(f"  {key}: {value}")
    
    print("\n" + "=" * 60)

