"""
외부 DB에서 데이터를 가져오는 서비스
report와 QuickNews DB에서 데이터 조회
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy import text, desc
from app.database import get_reports_db, get_news_db


class ExternalDataService:
    """외부 DB 데이터 조회 서비스"""
    
    # ========== 리포트 관련 ==========
    
    @staticmethod
    def get_recent_reports(limit: int = 20, category: Optional[str] = None) -> List[Dict]:
        """
        최근 증권사 리포트 조회
        
        Args:
            limit: 최대 개수
            category: 카테고리 필터 (옵션)
        """
        with get_reports_db() as session:
            query = """
                SELECT 
                    id, date, category, title, pdf_url, sent
                FROM sent_reports
                WHERE 1=1
            """
            params = {}
            
            if category:
                query += " AND category = :category"
                params["category"] = category
            
            query += " ORDER BY date DESC LIMIT :limit"
            params["limit"] = limit
            
            result = session.execute(text(query), params)
            
            reports = []
            for row in result:
                reports.append({
                    "id": row[0],
                    "date": row[1],
                    "category": row[2],
                    "title": row[3],
                    "pdf_url": row[4],
                    "sent": bool(row[5])
                })
            
            return reports
    
    @staticmethod
    def get_report_analysis(report_id: Optional[int] = None, 
                           stock_code: Optional[str] = None,
                           limit: int = 50) -> List[Dict]:
        """
        리포트 분석 데이터 조회 (종목, 목표가 등)
        
        Args:
            report_id: 특정 리포트 ID
            stock_code: 특정 종목 코드
            limit: 최대 개수
        """
        with get_reports_db() as session:
            query = """
                SELECT 
                    ra.id, ra.report_id, ra.stock_code, ra.stock_name,
                    ra.current_price, ra.target_price, ra.price_change,
                    ra.recommendation, ra.adjustment_type, ra.profit_impact,
                    ra.analysis_date,
                    sr.title, sr.category, sr.pdf_url
                FROM report_analysis ra
                LEFT JOIN sent_reports sr ON ra.report_id = sr.id
                WHERE 1=1
            """
            params = {}
            
            if report_id:
                query += " AND ra.report_id = :report_id"
                params["report_id"] = report_id
            
            if stock_code:
                query += " AND ra.stock_code = :stock_code"
                params["stock_code"] = stock_code
            
            query += " ORDER BY ra.analysis_date DESC LIMIT :limit"
            params["limit"] = limit
            
            result = session.execute(text(query), params)
            
            analyses = []
            for row in result:
                analyses.append({
                    "id": row[0],
                    "report_id": row[1],
                    "stock_code": row[2],
                    "stock_name": row[3],
                    "current_price": row[4],
                    "target_price": row[5],
                    "price_change": row[6],
                    "recommendation": row[7],
                    "adjustment_type": row[8],
                    "profit_impact": row[9],
                    "analysis_date": row[10],
                    "report_title": row[11],
                    "report_category": row[12],
                    "pdf_url": row[13]
                })
            
            return analyses
    
    @staticmethod
    def get_houses() -> List[Dict]:
        """증권사 목록 조회"""
        with get_reports_db() as session:
            query = """
                SELECT id, name, full_name, created_at
                FROM houses
                ORDER BY name
            """
            result = session.execute(text(query))
            
            houses = []
            for row in result:
                houses.append({
                    "id": row[0],
                    "name": row[1],
                    "full_name": row[2],
                    "created_at": row[3]
                })
            
            return houses
    
    @staticmethod
    def get_analysts(house_id: Optional[int] = None) -> List[Dict]:
        """
        애널리스트 목록 조회
        
        Args:
            house_id: 특정 증권사의 애널리스트만 조회
        """
        with get_reports_db() as session:
            query = """
                SELECT 
                    a.id, a.name, a.department, a.position,
                    a.house_id, h.name as house_name, h.full_name as house_full_name
                FROM analysts a
                LEFT JOIN houses h ON a.house_id = h.id
                WHERE 1=1
            """
            params = {}
            
            if house_id:
                query += " AND a.house_id = :house_id"
                params["house_id"] = house_id
            
            query += " ORDER BY a.name"
            
            result = session.execute(text(query), params)
            
            analysts = []
            for row in result:
                analysts.append({
                    "id": row[0],
                    "name": row[1],
                    "department": row[2],
                    "position": row[3],
                    "house_id": row[4],
                    "house_name": row[5],
                    "house_full_name": row[6]
                })
            
            return analysts
    
    @staticmethod
    def get_top_recommendations(limit: int = 10) -> List[Dict]:
        """
        최근 상위 추천 종목 (목표가 상승률 기준)
        """
        with get_reports_db() as session:
            query = """
                SELECT 
                    ra.stock_code, ra.stock_name,
                    ra.current_price, ra.target_price,
                    ((ra.target_price - ra.current_price) / ra.current_price * 100) as upside_percent,
                    ra.recommendation, ra.analysis_date,
                    sr.title, sr.pdf_url
                FROM report_analysis ra
                LEFT JOIN sent_reports sr ON ra.report_id = sr.id
                WHERE ra.target_price > 0 AND ra.current_price > 0
                ORDER BY upside_percent DESC
                LIMIT :limit
            """
            result = session.execute(text(query), {"limit": limit})
            
            recommendations = []
            for row in result:
                recommendations.append({
                    "stock_code": row[0],
                    "stock_name": row[1],
                    "current_price": row[2],
                    "target_price": row[3],
                    "upside_percent": round(row[4], 2),
                    "recommendation": row[5],
                    "analysis_date": row[6],
                    "report_title": row[7],
                    "pdf_url": row[8]
                })
            
            return recommendations
    
    # ========== 뉴스 관련 ==========
    
    @staticmethod
    def get_recent_news(limit: int = 50, source: Optional[str] = None) -> List[Dict]:
        """
        최근 뉴스 조회
        
        Args:
            limit: 최대 개수
            source: 소스 필터 (옵션)
        """
        with get_news_db() as session:
            query = """
                SELECT 
                    id, title, link, normalized_link,
                    article_id, office_id, source, sent_at
                FROM news
                WHERE 1=1
            """
            params = {}
            
            if source:
                query += " AND source = :source"
                params["source"] = source
            
            query += " ORDER BY sent_at DESC LIMIT :limit"
            params["limit"] = limit
            
            result = session.execute(text(query), params)
            
            news_list = []
            for row in result:
                news_list.append({
                    "id": row[0],
                    "title": row[1],
                    "link": row[2],
                    "normalized_link": row[3],
                    "article_id": row[4],
                    "office_id": row[5],
                    "source": row[6],
                    "sent_at": row[7]
                })
            
            return news_list
    
    @staticmethod
    def get_news_sources() -> List[Dict]:
        """뉴스 소스 목록 및 개수"""
        with get_news_db() as session:
            query = """
                SELECT source, COUNT(*) as count
                FROM news
                GROUP BY source
                ORDER BY count DESC
            """
            result = session.execute(text(query))
            
            sources = []
            for row in result:
                sources.append({
                    "source": row[0],
                    "count": row[1]
                })
            
            return sources
    
    @staticmethod
    def search_news(keyword: str, limit: int = 30) -> List[Dict]:
        """
        뉴스 제목으로 검색
        
        Args:
            keyword: 검색 키워드
            limit: 최대 개수
        """
        with get_news_db() as session:
            query = """
                SELECT 
                    id, title, link, source, sent_at
                FROM news
                WHERE title LIKE :keyword
                ORDER BY sent_at DESC
                LIMIT :limit
            """
            result = session.execute(
                text(query), 
                {"keyword": f"%{keyword}%", "limit": limit}
            )
            
            news_list = []
            for row in result:
                news_list.append({
                    "id": row[0],
                    "title": row[1],
                    "link": row[2],
                    "source": row[3],
                    "sent_at": row[4]
                })
            
            return news_list
    
    # ========== 통합 데이터 ==========
    
    @staticmethod
    def get_dashboard_summary() -> Dict:
        """
        대시보드용 요약 데이터
        """
        with get_reports_db() as reports_db, get_news_db() as news_db:
            # 리포트 통계
            reports_count = reports_db.execute(
                text("SELECT COUNT(*) FROM sent_reports")
            ).scalar()
            
            analysis_count = reports_db.execute(
                text("SELECT COUNT(*) FROM report_analysis")
            ).scalar()
            
            # 뉴스 통계
            news_count = news_db.execute(
                text("SELECT COUNT(*) FROM news")
            ).scalar()
            
            # 최근 24시간 뉴스
            yesterday = (datetime.now() - timedelta(days=1)).isoformat()
            recent_news_count = news_db.execute(
                text("SELECT COUNT(*) FROM news WHERE sent_at > :yesterday"),
                {"yesterday": yesterday}
            ).scalar()
            
            return {
                "reports": {
                    "total_reports": reports_count,
                    "total_analysis": analysis_count
                },
                "news": {
                    "total_news": news_count,
                    "recent_24h": recent_news_count
                }
            }


# 편의 함수들
def get_latest_reports(limit: int = 10):
    """최신 리포트 10개"""
    return ExternalDataService.get_recent_reports(limit=limit)


def get_latest_news(limit: int = 20):
    """최신 뉴스 20개"""
    return ExternalDataService.get_recent_news(limit=limit)


def get_stock_analysis(stock_code: str):
    """특정 종목 분석"""
    return ExternalDataService.get_report_analysis(stock_code=stock_code)



