from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

# Import routers
from app.api import market, sectors, week52, macro, news, portfolio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting SimplyStock API...")
    yield
    # Shutdown
    print("👋 Shutting down SimplyStock API...")

app = FastAPI(
    title="SimplyStock API",
    description="종합 주식 인사이트 플랫폼 API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 설정
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(sectors.router, prefix="/api/sectors", tags=["Sectors"])
app.include_router(week52.router, prefix="/api/52week", tags=["52 Week High/Low"])
app.include_router(macro.router, prefix="/api/macro", tags=["Macro Indicators"])
app.include_router(news.router, prefix="/api/news", tags=["News"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to SimplyStock API",
        "version": "0.1.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

