from fastapi import APIRouter
from typing import Dict, List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class MacroIndicator(BaseModel):
    name: str
    value: float
    unit: str
    change: float | None = None
    timestamp: datetime

@router.get("/overview")
async def get_macro_overview():
    """매크로 지표 개요"""
    return {
        "indicators": {
            "fear_greed": {
                "name": "CNN Fear & Greed Index",
                "value": 65,
                "label": "Greed",
                "timestamp": datetime.now()
            },
            "m2": {
                "name": "M2 Money Supply",
                "value": 21.2,
                "unit": "Trillion USD",
                "timestamp": datetime.now()
            },
            "fed_funds_rate": {
                "name": "Federal Funds Rate",
                "value": 5.5,
                "unit": "Percent",
                "timestamp": datetime.now()
            },
            "vix": {
                "name": "VIX Index",
                "value": 13.8,
                "status": "Low",
                "timestamp": datetime.now()
            }
        }
    }

@router.get("/fear-greed")
async def get_fear_greed_index():
    """CNN Fear & Greed Index"""
    return {
        "value": 65,
        "classification": "Greed",
        "timestamp": datetime.now()
    }

@router.get("/interest-rates")
async def get_interest_rates():
    """금리 정보"""
    return {
        "fed_funds_rate": {
            "value": 5.5,
            "unit": "percent"
        },
        "treasury_10y": {
            "value": 4.35,
            "unit": "percent"
        },
        "treasury_2y": {
            "value": 4.82,
            "unit": "percent"
        }
    }

@router.get("/exchange-rates")
async def get_exchange_rates():
    """환율 정보"""
    return {
        "usd_krw": {
            "value": 1308.50,
            "change": 2.30
        },
        "dxy": {
            "value": 104.25,
            "change": -0.15
        }
    }

