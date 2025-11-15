"""
증권사 리포트 API
report DB에서 데이터 제공
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.services.external_data_service import ExternalDataService

router = APIRouter()

# Response Models
class Report(BaseModel):
    id: int
    date: str
    category: str
    title: str
    pdf_url: Optional[str] = None
    sent: bool

class ReportAnalysis(BaseModel):
    id: int
    report_id: int
    stock_code: str
    stock_name: str
    current_price: Optional[float] = None
    target_price: Optional[float] = None
    price_change: Optional[float] = None
    upside_percent: Optional[float] = None
    recommendation: Optional[str] = None
    adjustment_type: Optional[str] = None
    profit_impact: Optional[str] = None
    analysis_date: str
    report_title: Optional[str] = None
    report_category: Optional[str] = None
    pdf_url: Optional[str] = None

class House(BaseModel):
    id: int
    name: str
    full_name: Optional[str] = None

class Analyst(BaseModel):
    id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    house_id: Optional[int] = None
    house_name: Optional[str] = None
    house_full_name: Optional[str] = None

class ReportsResponse(BaseModel):
    reports: List[Report]
    total: int
    page: int
    page_size: int

class AnalysisResponse(BaseModel):
    analyses: List[ReportAnalysis]
    total: int


@router.get("/", response_model=ReportsResponse)
async def get_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
):
    """
    증권사 리포트 목록 조회
    - category: 카테고리 필터
    """
    try:
        reports = ExternalDataService.get_recent_reports(
            limit=page_size * page,
            category=category
        )
        
        # 페이징
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_reports = reports[start_idx:end_idx]
        
        return ReportsResponse(
            reports=paginated_reports,
            total=len(reports),
            page=page,
            page_size=page_size
        )
    except Exception as e:
        print(f"❌ 리포트 조회 에러: {e}")
        return ReportsResponse(
            reports=[],
            total=0,
            page=page,
            page_size=page_size
        )


@router.get("/analysis", response_model=AnalysisResponse)
async def get_analysis(
    stock_code: Optional[str] = None,
    report_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200)
):
    """
    리포트 분석 데이터 조회 (종목별 목표가, 추천 등)
    - stock_code: 특정 종목 코드로 필터
    - report_id: 특정 리포트의 분석만 조회
    """
    try:
        analyses = ExternalDataService.get_report_analysis(
            report_id=report_id,
            stock_code=stock_code,
            limit=limit
        )
        
        # upside_percent 계산
        for analysis in analyses:
            if analysis.get("current_price") and analysis.get("target_price"):
                current = analysis["current_price"]
                target = analysis["target_price"]
                if current > 0:
                    analysis["upside_percent"] = round(
                        ((target - current) / current) * 100, 2
                    )
        
        return AnalysisResponse(
            analyses=analyses,
            total=len(analyses)
        )
    except Exception as e:
        print(f"❌ 분석 조회 에러: {e}")
        return AnalysisResponse(
            analyses=[],
            total=0
        )


@router.get("/top-recommendations")
async def get_top_recommendations(
    limit: int = Query(10, ge=1, le=50)
):
    """
    상위 추천 종목 (목표가 상승 여력 기준)
    """
    try:
        recommendations = ExternalDataService.get_top_recommendations(limit=limit)
        return {
            "recommendations": recommendations,
            "total": len(recommendations)
        }
    except Exception as e:
        print(f"❌ 추천 종목 조회 에러: {e}")
        return {
            "recommendations": [],
            "total": 0
        }


@router.get("/houses")
async def get_houses():
    """
    증권사 목록
    """
    try:
        houses = ExternalDataService.get_houses()
        return {
            "houses": houses,
            "total": len(houses)
        }
    except Exception as e:
        print(f"❌ 증권사 조회 에러: {e}")
        return {
            "houses": [],
            "total": 0
        }


@router.get("/analysts")
async def get_analysts(
    house_id: Optional[int] = None
):
    """
    애널리스트 목록
    - house_id: 특정 증권사의 애널리스트만 조회
    """
    try:
        analysts = ExternalDataService.get_analysts(house_id=house_id)
        return {
            "analysts": analysts,
            "total": len(analysts)
        }
    except Exception as e:
        print(f"❌ 애널리스트 조회 에러: {e}")
        return {
            "analysts": [],
            "total": 0
        }


@router.get("/summary")
async def get_reports_summary():
    """
    리포트 데이터 요약 통계
    """
    try:
        summary = ExternalDataService.get_dashboard_summary()
        return summary.get("reports", {})
    except Exception as e:
        print(f"❌ 요약 조회 에러: {e}")
        return {
            "total_reports": 0,
            "total_analysis": 0
        }



