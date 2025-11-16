"""
외부 데이터베이스(QuickNews, Reports) 연동 서비스
"""

from typing import List, Dict, Optional
from sqlalchemy import text
from app.database import get_news_db, get_reports_db
from pathlib import Path
import os

class ExternalDataService:
    
    # 상위 폴더 경로 (SimplyStock의 상위 폴더가 Vibe)
    # backend/app/services/external_data_service.py -> SimplyStock -> Vibe
    _current_file = Path(__file__).resolve()
    # SimplyStock/backend/app/services/external_data_service.py
    # -> SimplyStock/backend/app/services (parent)
    # -> SimplyStock/backend/app (parent.parent)
    # -> SimplyStock/backend (parent.parent.parent)
    # -> SimplyStock (parent.parent.parent.parent)
    # -> Vibe (parent.parent.parent.parent.parent)
    VIBE_DIR = _current_file.parent.parent.parent.parent.parent
    
    @staticmethod
    def read_summary_file(file_path: Optional[str]) -> Optional[str]:
        """file_path를 기반으로 _summary.txt 파일을 읽어옵니다."""
        if not file_path:
            return None
        
        try:
            # file_path에서 .pdf를 _summary.txt로 변경
            summary_path = file_path.replace('.pdf', '_summary.txt')
            full_path = ExternalDataService.VIBE_DIR / "report" / summary_path
            
            # 디버깅: 파일 경로 출력
            if not full_path.exists():
                # 파일명에 특수문자가 있을 수 있으므로 디렉토리에서 찾기 시도
                parent_dir = full_path.parent
                if parent_dir.exists():
                    # 파일명에서 확장자 제거 후 _summary.txt로 검색
                    base_name = full_path.stem.replace('_summary', '')
                    for file in parent_dir.glob(f"{base_name}*_summary.txt"):
                        full_path = file
                        break
            
            if full_path.exists():
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    # "요약 내용:" 이후의 텍스트만 추출
                    if "요약 내용:" in content:
                        summary = content.split("요약 내용:", 1)[1].strip()
                        return summary  # 전체 요약 반환 (모달에서 표시)
                    return content  # "요약 내용:"이 없으면 전체 내용 반환
        except Exception as e:
            print(f"요약 파일 읽기 에러 ({file_path}): {e}")
        
        return None
    
    # ===== QuickNews DB =====
    
    @staticmethod
    def get_news(limit: int = 25, offset: int = 0, source: Optional[str] = None) -> List[Dict]:
        """QuickNews DB에서 뉴스 조회 (페이지네이션 지원)"""
        with get_news_db() as session:
            if source:
                # 특정 소스만 가져오기
                query = "SELECT id, title, link, source, sent_at FROM news WHERE source = :source ORDER BY sent_at DESC LIMIT :limit OFFSET :offset"
                result = session.execute(text(query), {"source": source, "limit": limit, "offset": offset})
            else:
                # 모든 소스의 뉴스를 시간순으로 가져오기
                query = "SELECT id, title, link, source, sent_at FROM news ORDER BY sent_at DESC LIMIT :limit OFFSET :offset"
                result = session.execute(text(query), {"limit": limit, "offset": offset})
            
            news = []
            for row in result:
                news.append({
                    "id": str(row[0]),
                    "title": row[1],
                    "summary": row[1],  # 제목을 summary로도 사용
                    "link": row[2],
                    "url": row[2],
                    "source": row[3],
                    "sent_at": row[4],
                    "published_at": row[4],
                    "sentiment": "neutral"
                })
            
            return news
    
    @staticmethod
    def get_news_count(source: Optional[str] = None) -> int:
        """QuickNews DB의 총 뉴스 개수"""
        with get_news_db() as session:
            if source:
                query = text("SELECT COUNT(*) as count FROM news WHERE source = :source")
                result = session.execute(query, {"source": source})
            else:
                query = text("SELECT COUNT(*) as count FROM news")
                result = session.execute(query)
            return result.fetchone()[0]
    
    # ===== Reports DB =====
    
    @staticmethod
    def get_reports(limit: int = 25, offset: int = 0, category: Optional[str] = None) -> List[Dict]:
        """Reports DB에서 리포트 조회 (페이지네이션 지원)"""
        with get_reports_db() as session:
            # 리포트 기본 정보 조회 (file_path도 포함)
            query = "SELECT id, date, category, title, file_path, pdf_url, sent FROM sent_reports"
            
            if category:
                query += " WHERE category = :category"
                query += " ORDER BY date DESC LIMIT :limit OFFSET :offset"
                result = session.execute(text(query), {"category": category, "limit": limit, "offset": offset})
            else:
                query += " ORDER BY date DESC LIMIT :limit OFFSET :offset"
                result = session.execute(text(query), {"limit": limit, "offset": offset})
            
            reports = []
            for row in result:
                report_id = row[0]
                
                # 해당 리포트의 종목 분석 정보 조회 (최대 3개)
                analysis_query = """
                SELECT stock_name, recommendation, target_price, current_price, 
                       adjustment_type, profit_impact
                FROM report_analysis
                WHERE report_id = :report_id AND stock_name IS NOT NULL
                LIMIT 3
                """
                analysis_result = session.execute(text(analysis_query), {"report_id": report_id})
                
                stocks = []
                for analysis_row in analysis_result:
                    stock_info = {
                        "name": analysis_row[0],
                        "recommendation": analysis_row[1],
                        "adjustment_type": analysis_row[4],  # 조정 유형 (상향/하향/유지)
                        "profit_impact": analysis_row[5]     # 수익 영향 (양호/보통/부진)
                    }
                    if analysis_row[2] and analysis_row[3]:  # target_price와 current_price가 있으면
                        upside = ((analysis_row[2] - analysis_row[3]) / analysis_row[3] * 100) if analysis_row[3] > 0 else 0
                        stock_info["upside"] = round(upside, 1)
                    stocks.append(stock_info)
                
                # 요약 파일 읽기
                file_path = row[4] if len(row) > 4 else None  # file_path는 5번째 컬럼 (인덱스 4)
                summary = ExternalDataService.read_summary_file(file_path)
                if summary:
                    print(f"✅ 요약 읽기 성공 (ID {report_id}): {summary[:50]}...")
                elif file_path:
                    print(f"⚠️ 요약 파일 없음 (ID {report_id}): {file_path}")
                
                reports.append({
                    "id": report_id,
                    "date": row[1],
                    "category": row[2],
                    "title": row[3],
                    "pdf_url": row[5],  # pdf_url은 6번째 컬럼 (인덱스 5)
                    "sent": bool(row[6]),  # sent는 7번째 컬럼 (인덱스 6)
                    "stocks": stocks,  # 분석된 종목 정보 추가
                    "summary": summary  # 요약 내용 추가
                })
            
            return reports
    
    @staticmethod
    def get_reports_count() -> int:
        """Reports DB의 총 리포트 개수"""
        with get_reports_db() as session:
            query = text("SELECT COUNT(*) as count FROM sent_reports")
            result = session.execute(query)
            return result.fetchone()[0]
    
    @staticmethod
    def get_report_analysis(report_id: Optional[int] = None, 
                           stock_code: Optional[str] = None,
                           limit: int = 50) -> List[Dict]:
        """리포트 분석 데이터 조회 (종목, 목표가 등)"""
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
    def get_top_recommendations(limit: int = 10) -> List[Dict]:
        """상위 추천 종목 (목표가 상승 여력 기준)"""
        with get_reports_db() as session:
            query = """
                SELECT 
                    ra.stock_code, ra.stock_name,
                    ra.current_price, ra.target_price,
                    ((ra.target_price - ra.current_price) * 100.0 / ra.current_price) AS upside_percent,
                    ra.recommendation, ra.analysis_date,
                    sr.title AS report_title, sr.pdf_url
                FROM report_analysis ra
                JOIN sent_reports sr ON ra.report_id = sr.id
                WHERE ra.recommendation = 'BUY' 
                  AND ra.target_price IS NOT NULL 
                  AND ra.current_price IS NOT NULL
                  AND ra.current_price > 0
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
    
    @staticmethod
    def get_houses(limit: int = 10) -> List[Dict]:
        """증권사 목록 조회 (리포트 수 기준 정렬)"""
        with get_reports_db() as session:
            try:
                # sent_reports 테이블에 house_id가 없으므로 단순 조회
                simple_query = "SELECT id, name, full_name FROM houses LIMIT :limit"
                result = session.execute(text(simple_query), {"limit": limit})
                
                houses = []
                for row in result:
                    houses.append({
                        "id": row[0],
                        "name": row[1],
                        "full_name": row[2],
                        "total_reports": 0  # 스키마에 관계가 없으므로 0
                    })
                
                return houses
            except Exception as e:
                print(f"houses 쿼리 에러: {e}")
                return []
    
    @staticmethod
    def get_analysts(house_id: Optional[int] = None, limit: int = 10) -> List[Dict]:
        """애널리스트 목록 조회"""
        with get_reports_db() as session:
            try:
                # sent_report_analysts 테이블이 없으므로 단순 조회
                if house_id:
                    query = """
                        SELECT a.id, a.name, a.department, a.position, a.house_id, h.name as house
                        FROM analysts a
                        LEFT JOIN houses h ON a.house_id = h.id
                        WHERE a.house_id = :house_id
                        LIMIT :limit
                    """
                    result = session.execute(text(query), {"house_id": house_id, "limit": limit})
                else:
                    query = """
                        SELECT a.id, a.name, a.department, a.position, a.house_id, h.name as house
                        FROM analysts a
                        LEFT JOIN houses h ON a.house_id = h.id
                        LIMIT :limit
                    """
                    result = session.execute(text(query), {"limit": limit})
                
                analysts = []
                for row in result:
                    analysts.append({
                        "id": row[0],
                        "name": row[1],
                        "department": row[2],
                        "position": row[3],
                        "house_id": row[4],
                        "house": row[5],
                        "total_reports": 0  # 스키마에 관계가 없으므로 0
                    })
                
                return analysts
            except Exception as e:
                print(f"analysts 쿼리 에러: {e}")
                return []
    
    @staticmethod
    def get_dashboard_summary() -> Dict:
        """대시보드용 요약 통계"""
        try:
            with get_reports_db() as reports_session, get_news_db() as news_session:
                # 리포트 통계
                reports_count = reports_session.execute(
                    text("SELECT COUNT(*) FROM sent_reports")
                ).scalar() or 0
                
                analysis_count = reports_session.execute(
                    text("SELECT COUNT(*) FROM report_analysis")
                ).scalar() or 0
                
                # 뉴스 통계
                news_count = news_session.execute(
                    text("SELECT COUNT(*) FROM news")
                ).scalar() or 0
                
                return {
                    "reports": {
                        "total_reports": reports_count,
                        "total_analysis": analysis_count,
                    },
                    "news": {
                        "total_news": news_count,
                    }
                }
        except Exception as e:
            print(f"dashboard_summary 에러: {e}")
            return {
                "reports": {
                    "total_reports": 0,
                    "total_analysis": 0,
                },
                "news": {
                    "total_news": 0,
                }
            }
