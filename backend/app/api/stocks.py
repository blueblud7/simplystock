"""
종목별 리포트 분석 API
각 종목의 리포트 히스토리와 목표가 변화 추이 제공
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.services.external_data_service import ExternalDataService
from app.database import get_reports_db
from sqlalchemy import text

router = APIRouter()

# Response Models
class StockReportHistory(BaseModel):
    id: int
    report_id: int
    report_date: str
    report_title: str
    report_category: str
    house_name: Optional[str] = None
    analyst_name: Optional[str] = None
    current_price: Optional[float] = None
    target_price: Optional[float] = None
    recommendation: Optional[str] = None
    adjustment_type: Optional[str] = None
    profit_impact: Optional[str] = None
    upside_percent: Optional[float] = None
    pdf_url: Optional[str] = None

class StockInfo(BaseModel):
    stock_code: str
    stock_name: str
    total_reports: int
    latest_report_date: Optional[str] = None
    latest_target_price: Optional[float] = None
    latest_recommendation: Optional[str] = None
    avg_target_price: Optional[float] = None
    avg_upside: Optional[float] = None

class StockDetailResponse(BaseModel):
    stock: StockInfo
    reports: List[StockReportHistory]
    total_reports: int

class StockListResponse(BaseModel):
    stocks: List[StockInfo]
    total: int


@router.get("/", response_model=StockListResponse)
async def get_stocks(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None
):
    """
    리포트가 있는 종목 목록 조회
    """
    try:
        offset = (page - 1) * page_size
        
        with get_reports_db() as session:
            # 검색 조건
            search_condition = ""
            params = {"limit": page_size, "offset": offset}
            
            if search:
                search_condition = "WHERE ra.stock_code LIKE :search OR ra.stock_name LIKE :search"
                params["search"] = f"%{search}%"
            
            # 종목별 리포트 통계
            query = f"""
                SELECT 
                    ra.stock_code,
                    ra.stock_name,
                    COUNT(DISTINCT ra.report_id) as total_reports,
                    MAX(sr.date) as latest_report_date,
                    (SELECT target_price FROM report_analysis ra2 
                     JOIN sent_reports sr2 ON ra2.report_id = sr2.id 
                     WHERE ra2.stock_code = ra.stock_code 
                     ORDER BY sr2.date DESC LIMIT 1) as latest_target_price,
                    (SELECT recommendation FROM report_analysis ra2 
                     JOIN sent_reports sr2 ON ra2.report_id = sr2.id 
                     WHERE ra2.stock_code = ra.stock_code 
                     ORDER BY sr2.date DESC LIMIT 1) as latest_recommendation,
                    AVG(ra.target_price) as avg_target_price,
                    AVG(CASE 
                        WHEN ra.current_price > 0 AND ra.target_price > 0 
                        THEN ((ra.target_price - ra.current_price) / ra.current_price * 100)
                        ELSE NULL 
                    END) as avg_upside
                FROM report_analysis ra
                JOIN sent_reports sr ON ra.report_id = sr.id
                {search_condition}
                GROUP BY ra.stock_code, ra.stock_name
                ORDER BY total_reports DESC, latest_report_date DESC
                LIMIT :limit OFFSET :offset
            """
            
            result = session.execute(text(query), params)
            rows = result.fetchall()
            
            stocks = []
            for row in rows:
                stocks.append({
                    "stock_code": row[0],
                    "stock_name": row[1],
                    "total_reports": row[2],
                    "latest_report_date": row[3],
                    "latest_target_price": row[4],
                    "latest_recommendation": row[5],
                    "avg_target_price": row[6],
                    "avg_upside": round(row[7], 2) if row[7] else None
                })
            
            # 전체 종목 수
            count_query = f"""
                SELECT COUNT(DISTINCT ra.stock_code)
                FROM report_analysis ra
                {search_condition}
            """
            count_params = {"search": params.get("search")} if search else {}
            count_result = session.execute(text(count_query), count_params)
            total = count_result.fetchone()[0]
            
            return {
                "stocks": stocks,
                "total": total
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"종목 목록 조회 실패: {str(e)}")


@router.get("/{stock_code}", response_model=StockDetailResponse)
async def get_stock_detail(
    stock_code: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    """
    특정 종목의 리포트 히스토리 및 목표가 변화 추이
    """
    try:
        offset = (page - 1) * page_size
        
        with get_reports_db() as session:
            # 종목 기본 정보
            stock_query = """
                SELECT 
                    ra.stock_code,
                    ra.stock_name,
                    COUNT(DISTINCT ra.report_id) as total_reports,
                    MAX(sr.date) as latest_report_date,
                    (SELECT target_price FROM report_analysis ra2 
                     JOIN sent_reports sr2 ON ra2.report_id = sr2.id 
                     WHERE ra2.stock_code = :stock_code 
                     ORDER BY sr2.date DESC LIMIT 1) as latest_target_price,
                    (SELECT recommendation FROM report_analysis ra2 
                     JOIN sent_reports sr2 ON ra2.report_id = sr2.id 
                     WHERE ra2.stock_code = :stock_code 
                     ORDER BY sr2.date DESC LIMIT 1) as latest_recommendation,
                    AVG(ra.target_price) as avg_target_price,
                    AVG(CASE 
                        WHEN ra.current_price > 0 AND ra.target_price > 0 
                        THEN ((ra.target_price - ra.current_price) / ra.current_price * 100)
                        ELSE NULL 
                    END) as avg_upside
                FROM report_analysis ra
                JOIN sent_reports sr ON ra.report_id = sr.id
                WHERE ra.stock_code = :stock_code
                GROUP BY ra.stock_code, ra.stock_name
            """
            
            stock_result = session.execute(text(stock_query), {"stock_code": stock_code})
            stock_row = stock_result.fetchone()
            
            if not stock_row:
                raise HTTPException(status_code=404, detail="종목을 찾을 수 없습니다")
            
            stock_info = {
                "stock_code": stock_row[0],
                "stock_name": stock_row[1],
                "total_reports": stock_row[2],
                "latest_report_date": stock_row[3],
                "latest_target_price": stock_row[4],
                "latest_recommendation": stock_row[5],
                "avg_target_price": stock_row[6],
                "avg_upside": round(stock_row[7], 2) if stock_row[7] else None
            }
            
            # 리포트 히스토리
            reports_query = """
                SELECT 
                    ra.id,
                    ra.report_id,
                    sr.date as report_date,
                    sr.title as report_title,
                    sr.category as report_category,
                    h.name as house_name,
                    a.name as analyst_name,
                    ra.current_price,
                    ra.target_price,
                    ra.recommendation,
                    ra.adjustment_type,
                    ra.profit_impact,
                    CASE 
                        WHEN ra.current_price > 0 AND ra.target_price > 0 
                        THEN ROUND(((ra.target_price - ra.current_price) / ra.current_price * 100), 2)
                        ELSE NULL 
                    END as upside_percent,
                    sr.pdf_url
                FROM report_analysis ra
                JOIN sent_reports sr ON ra.report_id = sr.id
                LEFT JOIN houses h ON ra.house_id = h.id
                LEFT JOIN analysts a ON ra.analyst_id = a.id
                WHERE ra.stock_code = :stock_code
                ORDER BY sr.date DESC, ra.id DESC
                LIMIT :limit OFFSET :offset
            """
            
            reports_result = session.execute(
                text(reports_query), 
                {"stock_code": stock_code, "limit": page_size, "offset": offset}
            )
            reports_rows = reports_result.fetchall()
            
            reports = []
            for row in reports_rows:
                reports.append({
                    "id": row[0],
                    "report_id": row[1],
                    "report_date": row[2],
                    "report_title": row[3],
                    "report_category": row[4],
                    "house_name": row[5],
                    "analyst_name": row[6],
                    "current_price": row[7],
                    "target_price": row[8],
                    "recommendation": row[9],
                    "adjustment_type": row[10],
                    "profit_impact": row[11],
                    "upside_percent": row[12],
                    "pdf_url": row[13]
                })
            
            return {
                "stock": stock_info,
                "reports": reports,
                "total_reports": stock_info["total_reports"]
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"종목 상세 조회 실패: {str(e)}")


@router.get("/{stock_code}/target-price-history")
async def get_target_price_history(stock_code: str):
    """
    종목의 목표가 변화 추이 (차트용)
    """
    try:
        with get_reports_db() as session:
            query = """
                SELECT 
                    sr.date,
                    ra.target_price,
                    ra.current_price,
                    h.name as house_name,
                    ra.recommendation
                FROM report_analysis ra
                JOIN sent_reports sr ON ra.report_id = sr.id
                LEFT JOIN houses h ON ra.house_id = h.id
                WHERE ra.stock_code = :stock_code
                AND ra.target_price IS NOT NULL
                ORDER BY sr.date ASC
            """
            
            result = session.execute(text(query), {"stock_code": stock_code})
            rows = result.fetchall()
            
            history = []
            for row in rows:
                history.append({
                    "date": row[0],
                    "target_price": row[1],
                    "current_price": row[2],
                    "house_name": row[3],
                    "recommendation": row[4]
                })
            
            return {
                "stock_code": stock_code,
                "history": history,
                "total_points": len(history)
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"목표가 히스토리 조회 실패: {str(e)}")


@router.get("/{stock_code}/recommendation-summary")
async def get_recommendation_summary(stock_code: str):
    """
    종목의 투자의견 요약 통계
    """
    try:
        with get_reports_db() as session:
            query = """
                SELECT 
                    ra.recommendation,
                    COUNT(*) as count,
                    AVG(ra.target_price) as avg_target,
                    MAX(sr.date) as latest_date
                FROM report_analysis ra
                JOIN sent_reports sr ON ra.report_id = sr.id
                WHERE ra.stock_code = :stock_code
                AND ra.recommendation IS NOT NULL
                GROUP BY ra.recommendation
                ORDER BY count DESC
            """
            
            result = session.execute(text(query), {"stock_code": stock_code})
            rows = result.fetchall()
            
            summary = []
            for row in rows:
                summary.append({
                    "recommendation": row[0],
                    "count": row[1],
                    "avg_target_price": row[2],
                    "latest_date": row[3]
                })
            
            return {
                "stock_code": stock_code,
                "summary": summary
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"투자의견 요약 조회 실패: {str(e)}")

