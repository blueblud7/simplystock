# 🚀 SimplyStock 시작 가이드

## 📋 사전 요구사항

- **Node.js** 18.0 이상
- **Python** 3.11 이상
- **PostgreSQL** 15 이상 (선택사항, 나중에 설정)
- **Redis** 7 이상 (선택사항, 캐싱용)

## 1️⃣ 프로젝트 설치

### Frontend (Next.js)

```bash
cd frontend
npm install
```

### Backend (FastAPI)

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

## 2️⃣ 환경 변수 설정

### Frontend `.env.local`

```bash
cd frontend
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend `.env`

```bash
cd backend
cp .env.example .env
```

중요한 API 키들을 설정하세요:

```env
# 필수 - 뉴스 수집용
NEWSAPI_KEY=your_key_here        # https://newsapi.org/
FINNHUB_API_KEY=your_key_here    # https://finnhub.io/

# 선택 - AI 요약용
OPENAI_API_KEY=your_key_here     # https://platform.openai.com/

# 선택 - 매크로 지표용
FRED_API_KEY=your_key_here       # https://fred.stlouisfed.org/
```

### 🆓 무료 API 키 받기

1. **NewsAPI** (무료: 100 요청/일)
   - https://newsapi.org/register
   - 이메일 인증 후 즉시 사용 가능

2. **Finnhub** (무료 tier)
   - https://finnhub.io/register
   - 주식 뉴스 및 데이터

3. **FRED (연준 데이터)**
   - https://fred.stlouisfed.org/docs/api/api_key.html
   - 무료, M2, 금리 데이터

4. **OpenAI** (선택사항, 유료)
   - https://platform.openai.com/signup
   - AI 뉴스 요약용 (GPT-4)
   - 시작 시 $5 크레딧 제공

## 3️⃣ 실행하기

### 터미널 1: Frontend

```bash
cd frontend
npm run dev
```

→ http://localhost:3000 에서 확인

### 터미널 2: Backend

```bash
cd backend
source venv/bin/activate  # 가상환경 활성화
uvicorn app.main:app --reload
```

→ http://localhost:8000/docs 에서 API 문서 확인

### 터미널 3: 데이터 수집 (선택)

```bash
cd backend
source venv/bin/activate
python data_collectors/run_all_collectors.py
```

이것은 다음 데이터를 수집합니다:
- 주요 지수 (S&P 500, NASDAQ, KOSPI 등)
- 52주 신고가/신저가
- 섹터별 퍼포먼스 (11개 섹터)
- 매크로 지표 (금리, 환율, VIX 등)
- 뉴스 (NewsAPI, Finnhub 등)

## 4️⃣ 주요 기능 둘러보기

### 📊 대시보드 (`/`)
- 주요 지수 현황
- 매크로 지표 요약
- 52주 신고가/신저가 하이라이트
- 섹터 히트맵
- 최신 뉴스

### 📈 섹터 분석 (`/sectors`)
- 11개 섹터 실시간 수익률
- 일별/주별/월별 히스토리 차트
- 섹터 로테이션 인사이트

### 🎯 52주 신고가/신저가 (`/52week`)
- 신고가/신저가 달성 종목 리스트
- 브레이크아웃 패턴 분석
- 시장 브레드스 분석

### 🌍 매크로 지표 (`/macro`)
- CNN Fear & Greed Index
- M2, 금리, 환율
- 국채 수익률 곡선
- 시장 상관관계 인사이트

### 📰 뉴스 허브 (`/news`)
- AI 분석 뉴스 피드
- 감성 분석
- 트렌딩 토픽
- 일일 시장 브리핑

### 💼 포트폴리오 (`/portfolio`)
- 보유 종목 추적 (구현 예정)
- 리스크 분석 (구현 예정)

## 5️⃣ 데이터 수집 자동화 (선택)

Celery를 사용하여 주기적으로 데이터를 수집할 수 있습니다:

```bash
# Redis 설치 (macOS)
brew install redis
redis-server

# Celery Worker 실행
cd backend
celery -A app.tasks worker --loglevel=info

# Celery Beat 실행 (스케줄러)
celery -A app.tasks beat --loglevel=info
```

## 6️⃣ 데이터베이스 설정 (선택)

PostgreSQL을 사용하여 데이터를 영구 저장할 수 있습니다:

```bash
# PostgreSQL 설치 (macOS)
brew install postgresql@15
brew services start postgresql@15

# 데이터베이스 생성
createdb simplystock

# .env 파일에 DATABASE_URL 설정
DATABASE_URL=postgresql://username:password@localhost/simplystock

# 마이그레이션 실행
cd backend
alembic upgrade head
```

## 🎨 UI 커스터마이징

Tailwind CSS와 shadcn/ui를 사용합니다:

- 색상 변경: `frontend/app/globals.css`
- 컴포넌트 추가: https://ui.shadcn.com/docs/components
- 레이아웃 수정: `frontend/components/layout/main-nav.tsx`

## 📚 추가 리소스

### API 문서
- FastAPI Docs: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

### 데이터 소스
- **주가 데이터**: Yahoo Finance (yfinance)
- **뉴스**: NewsAPI, Finnhub
- **매크로**: FRED, Yahoo Finance
- **섹터**: SPDR ETFs (XLK, XLF, XLV 등)

## 🐛 문제 해결

### Frontend가 실행되지 않을 때

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend 에러

```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt --upgrade
```

### 데이터 수집 실패

- API 키가 올바른지 확인
- 무료 API 할당량 확인 (NewsAPI: 100/일)
- 인터넷 연결 확인

## 🚀 다음 단계

1. **데이터베이스 연동**: PostgreSQL + SQLAlchemy
2. **사용자 인증**: JWT 기반 로그인
3. **알림 시스템**: 이메일/Slack 알림
4. **모바일 앱**: React Native + Expo
5. **프로덕션 배포**: Vercel (Frontend) + AWS/GCP (Backend)

## 💡 팁

- **개발 모드**: 코드 변경 시 자동으로 재시작됩니다
- **API 테스트**: http://localhost:8000/docs 에서 직접 테스트 가능
- **에러 확인**: 터미널에서 로그 확인
- **성능**: Redis 캐싱으로 API 응답 속도 향상

---

**문의사항이 있으시면 이슈를 등록해주세요!** 🙋‍♂️

