# 🔗 외부 DB 연동 가이드

SimplyStock는 상위 폴더의 `report`와 `QuickNews` DB와 연동되어 있습니다.

## 📊 연결된 데이터베이스

### 1. **reports.db** (증권사 리포트)
- **위치**: `../report/reports.db`
- **데이터**: 2,919개 리포트
- **주요 테이블**:
  - `sent_reports`: 리포트 정보
  - `report_analysis`: 종목 분석 (목표가, 추천)
  - `houses`: 증권사 정보
  - `analysts`: 애널리스트 정보

### 2. **news.db** (뉴스)
- **위치**: `../QuickNews/news.db`
- **데이터**: 4,952개 뉴스
- **주요 테이블**:
  - `news`: 뉴스 기사

---

## 🚀 새로운 API 엔드포인트

### 📰 뉴스 API (업데이트)

#### `GET /api/news/`
**실제 QuickNews DB에서 뉴스 가져오기**

```bash
# 최근 뉴스 20개
curl http://localhost:8000/api/news/

# 특정 소스 필터
curl http://localhost:8000/api/news/?source=naver

# 페이징
curl http://localhost:8000/api/news/?page=2&page_size=10
```

**응답 예시:**
```json
{
  "articles": [
    {
      "id": "4952",
      "title": "삼성전자, 신규 반도체 공장 투자 발표",
      "summary": "삼성전자, 신규 반도체 공장 투자 발표",
      "source": "naver",
      "url": "https://n.news.naver.com/...",
      "published_at": "2024-01-15T10:30:00",
      "sentiment": "neutral",
      "sentiment_score": 0.0,
      "tickers": [],
      "category": "general"
    }
  ],
  "total": 4952,
  "page": 1,
  "page_size": 20
}
```

---

### 📊 증권사 리포트 API (신규)

#### `GET /api/reports/`
**증권사 리포트 목록**

```bash
# 최근 리포트 20개
curl http://localhost:8000/api/reports/

# 카테고리별 필터
curl http://localhost:8000/api/reports/?category=기업분석
```

**응답:**
```json
{
  "reports": [
    {
      "id": 1,
      "date": "2024-01-15",
      "category": "기업분석",
      "title": "삼성전자 목표가 상향",
      "pdf_url": "https://...",
      "sent": true
    }
  ],
  "total": 2919,
  "page": 1,
  "page_size": 20
}
```

#### `GET /api/reports/analysis`
**리포트 분석 데이터 (종목별 목표가, 추천)**

```bash
# 특정 종목의 분석
curl http://localhost:8000/api/reports/analysis?stock_code=005930

# 특정 리포트의 분석
curl http://localhost:8000/api/reports/analysis?report_id=123
```

**응답:**
```json
{
  "analyses": [
    {
      "id": 1,
      "report_id": 123,
      "stock_code": "005930",
      "stock_name": "삼성전자",
      "current_price": 75000,
      "target_price": 95000,
      "upside_percent": 26.67,
      "recommendation": "매수",
      "analysis_date": "2024-01-15",
      "report_title": "삼성전자 목표가 상향",
      "pdf_url": "https://..."
    }
  ],
  "total": 150
}
```

#### `GET /api/reports/top-recommendations`
**상위 추천 종목 (목표가 상승 여력 순)**

```bash
curl http://localhost:8000/api/reports/top-recommendations?limit=10
```

**응답:**
```json
{
  "recommendations": [
    {
      "stock_code": "005930",
      "stock_name": "삼성전자",
      "current_price": 75000,
      "target_price": 95000,
      "upside_percent": 26.67,
      "recommendation": "매수",
      "analysis_date": "2024-01-15",
      "report_title": "삼성전자 목표가 상향",
      "pdf_url": "https://..."
    }
  ],
  "total": 10
}
```

#### `GET /api/reports/houses`
**증권사 목록**

```bash
curl http://localhost:8000/api/reports/houses
```

#### `GET /api/reports/analysts`
**애널리스트 목록**

```bash
# 전체 애널리스트
curl http://localhost:8000/api/reports/analysts

# 특정 증권사의 애널리스트
curl http://localhost:8000/api/reports/analysts?house_id=1
```

#### `GET /api/reports/summary`
**리포트 데이터 요약**

```bash
curl http://localhost:8000/api/reports/summary
```

---

## 🔧 코드 구조

### 1. **database.py**
다중 DB 연결 관리

```python
from app.database import (
    get_reports_db,    # 리포트 DB 세션
    get_news_db,       # 뉴스 DB 세션
    get_main_db        # SimplyStock 메인 DB 세션
)

# 사용 예시
with get_reports_db() as session:
    result = session.execute("SELECT * FROM sent_reports LIMIT 10")
```

### 2. **external_data_service.py**
외부 DB 데이터 조회 서비스

```python
from app.services.external_data_service import ExternalDataService

# 최근 리포트 가져오기
reports = ExternalDataService.get_recent_reports(limit=20)

# 최근 뉴스 가져오기
news = ExternalDataService.get_recent_news(limit=50)

# 특정 종목 분석
analysis = ExternalDataService.get_report_analysis(stock_code="005930")

# 상위 추천 종목
top_picks = ExternalDataService.get_top_recommendations(limit=10)
```

### 3. **API 라우터**
- `app/api/news.py` - 뉴스 API (업데이트)
- `app/api/reports.py` - 리포트 API (신규)

---

## 🧪 테스트

### DB 연결 테스트
```bash
cd backend
python3 app/database.py
```

### API 테스트
```bash
# 서버 실행
cd backend
uvicorn app.main:app --reload

# 브라우저에서 API 문서 확인
open http://localhost:8000/docs

# 뉴스 API 테스트
curl http://localhost:8000/api/news/ | jq

# 리포트 API 테스트
curl http://localhost:8000/api/reports/ | jq
curl http://localhost:8000/api/reports/top-recommendations | jq
```

---

## 📝 주의사항

1. **읽기 전용**: 외부 DB는 읽기만 가능합니다 (쓰기는 원본 서비스에서만)
2. **DB 위치**: report와 QuickNews 폴더가 상위 디렉토리에 있어야 합니다
3. **동시성**: SQLite는 동시 쓰기에 제한이 있지만, 읽기는 문제없습니다
4. **에러 처리**: DB 연결 실패 시 빈 데이터를 반환합니다

---

## 🔮 향후 확장

### 1. 캐싱 추가
```python
# Redis로 자주 조회되는 데이터 캐싱
@cache(expire=300)  # 5분 캐시
def get_top_recommendations():
    return ExternalDataService.get_top_recommendations()
```

### 2. 데이터 통합
- 뉴스와 리포트를 종목별로 통합
- 리포트 분석 + 뉴스 감성 분석 결합
- AI 요약 추가

### 3. 실시간 업데이트
- 원본 DB가 업데이트되면 자동으로 반영
- WebSocket으로 프론트엔드에 푸시

---

## 📚 관련 파일

- `backend/app/database.py` - DB 연결 설정
- `backend/app/services/external_data_service.py` - 데이터 조회 서비스
- `backend/app/api/news.py` - 뉴스 API
- `backend/app/api/reports.py` - 리포트 API
- `backend/app/main.py` - FastAPI 앱 설정



