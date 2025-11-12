# 📊 SimplyStock - 종합 주식 인사이트 플랫폼

매일 업데이트되는 뉴스, 리포트, 매크로 지표를 기반으로 투자 인사이트를 제공하는 통합 플랫폼

## 🎯 주요 기능

### 📈 시장 데이터
- **52주 신고가/신저가**: 실시간 업데이트 및 히스토리 추적
- **섹터별 분석**: 11개 주요 섹터의 일별/주별/월별 수익률
- **주요 지수**: S&P 500, NASDAQ, KOSPI 실시간 모니터링
- **시계열 차트**: 주별, 월별, 연별 히스토리 그래프

### 🌍 매크로 지표
- **CNN Fear & Greed Index**: 시장 심리 지표
- **M2 통화량**: 유동성 추적
- **금리**: 연준 기준금리, 국채 수익률
- **환율**: USD/KRW, DXY 달러 인덱스
- **변동성**: VIX, Put/Call Ratio

### 📰 뉴스 & 인사이트
- **AI 뉴스 요약**: GPT-4 기반 자동 요약
- **감성 분석**: 뉴스 톤 분석 (긍정/중립/부정)
- **개인화 피드**: 관심 종목/섹터 기반 큐레이션
- **실시간 알림**: 중요 이벤트 즉시 알림

### 💼 포트폴리오
- **리스크 분석**: 보유 종목 리스크 평가
- **매크로 영향도**: 금리/환율 변화 시 포트폴리오 영향 시뮬레이션
- **추천 엔진**: 현재 시장 환경 최적 자산 배분

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts + TradingView Widgets
- **State**: Zustand
- **API**: React Query (TanStack Query)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL + TimescaleDB
- **Cache**: Redis
- **Task Queue**: Celery + Redis
- **AI**: OpenAI GPT-4, FinBERT

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: AWS ECS / Google Cloud Run
- **Database**: AWS RDS / Supabase
- **CI/CD**: GitHub Actions

## 📦 프로젝트 구조

```
SimplyStock/
├── frontend/                 # Next.js 프론트엔드
│   ├── app/                 # App Router 페이지
│   │   ├── page.tsx        # 메인 대시보드
│   │   ├── sectors/        # 섹터별 분석
│   │   ├── 52week/         # 52주 신고가/신저가
│   │   ├── macro/          # 매크로 지표
│   │   ├── news/           # 뉴스 허브
│   │   └── portfolio/      # 포트폴리오
│   ├── components/          # 재사용 컴포넌트
│   │   ├── ui/             # shadcn/ui 컴포넌트
│   │   ├── charts/         # 차트 컴포넌트
│   │   └── dashboard/      # 대시보드 위젯
│   ├── lib/                # 유틸리티, API 클라이언트
│   └── public/             # 정적 파일
│
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py         # FastAPI 앱
│   │   ├── api/            # API 라우터
│   │   │   ├── market.py   # 시장 데이터
│   │   │   ├── sectors.py  # 섹터 데이터
│   │   │   ├── macro.py    # 매크로 지표
│   │   │   └── news.py     # 뉴스 API
│   │   ├── models/         # 데이터베이스 모델
│   │   ├── services/       # 비즈니스 로직
│   │   ├── tasks/          # Celery 태스크
│   │   └── utils/          # 유틸리티
│   ├── data_collectors/    # 데이터 수집 스크립트
│   │   ├── market_data.py  # 주가, 52주 신고가/신저가
│   │   ├── sector_data.py  # 섹터별 수익률
│   │   ├── macro_data.py   # CNN, M2, 금리, 환율
│   │   └── news_crawler.py # 뉴스 크롤링
│   ├── ai/                 # AI 모듈
│   │   ├── summarizer.py   # 뉴스 요약
│   │   └── sentiment.py    # 감성 분석
│   └── requirements.txt
│
├── database/               # 데이터베이스 스키마
│   └── migrations/
│
└── docker/                # Docker 설정
    ├── docker-compose.yml
    └── Dockerfile
```

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### 설치 및 실행

#### 1. Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

#### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# http://localhost:8000
```

#### 3. 데이터 수집
```bash
cd backend
python data_collectors/market_data.py
python data_collectors/sector_data.py
python data_collectors/macro_data.py
```

## 📊 주요 페이지

### 1. 메인 대시보드 (`/`)
- 주요 지표 요약
- 오늘의 시장 브리핑 (AI 생성)
- 52주 신고가/신저가 하이라이트
- 섹터별 히트맵

### 2. 섹터 분석 (`/sectors`)
- 11개 섹터 실시간 수익률
- 일별/주별/월별 히스토리 차트
- 섹터별 Top/Bottom 종목
- 섹터 로테이션 인사이트

### 3. 52주 신고가/신저가 (`/52week`)
- 신고가/신저가 달성 종목 리스트
- 브레이크아웃 패턴 분석
- 주별/월별 히스토리
- 알림 설정

### 4. 매크로 지표 (`/macro`)
- CNN Fear & Greed Index
- M2, 금리, 환율 트렌드
- 역사적 비교 차트
- 시장 상관관계 분석

### 5. 뉴스 허브 (`/news`)
- 실시간 뉴스 피드
- AI 요약 및 인사이트
- 감성 분석
- 종목/섹터 필터링

### 6. 포트폴리오 (`/portfolio`)
- 보유 종목 입력
- 리스크 분석
- 매크로 시나리오 시뮬레이션

## 🔑 환경 변수

`.env.local` (Frontend)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

`.env` (Backend)
```env
DATABASE_URL=postgresql://user:password@localhost/simplystock
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key
```

## 📈 데이터 소스

- **시장 데이터**: Yahoo Finance, Alpha Vantage, Finnhub
- **섹터 데이터**: SPDR ETFs (XLK, XLF, XLV, etc.)
- **CNN 지표**: CNN Fear & Greed Index API
- **M2 통화량**: Federal Reserve FRED API
- **금리**: Treasury.gov, FRED API
- **환율**: Exchange Rate API, Yahoo Finance

## 🤝 기여

이슈와 PR을 환영합니다!

## 📄 라이선스

MIT License

---

**Made with ❤️ for Smart Investors**

