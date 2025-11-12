# 📋 SimplyStock 개발 로드맵

## 🎯 Phase 1: 기반 구축 (완료 ✅)

### 1.1 프로젝트 초기 설정
- [x] 프로젝트 구조 생성
- [x] Frontend (Next.js) 설정
- [x] Backend (FastAPI) 설정
- [x] 기본 UI 컴포넌트
- [x] API 엔드포인트 구조

### 1.2 데이터 수집 파이프라인
- [x] 뉴스 수집 스크립트 (NewsAPI, Finnhub, Yahoo RSS)
- [x] 매크로 지표 수집 (FRED, Yahoo Finance)
- [x] 시장 데이터 수집 (주요 지수, 52주 신고가/신저가)
- [x] 섹터 데이터 수집 (SPDR ETF)
- [x] AI 분석 통합 (OpenAI)

### 1.3 페이지 구현
- [x] 메인 대시보드
- [x] 섹터 분석 페이지
- [x] 52주 신고가/신저가 페이지
- [x] 매크로 지표 페이지
- [x] 뉴스 허브 페이지
- [x] 포트폴리오 페이지 (기본 구조)

---

## 🚀 Phase 2: 데이터베이스 & 캐시 (진행 중 🔄)

### 2.1 데이터베이스 설계 및 구현
**우선순위: HIGH**

#### 2.1.1 스키마 설계
- [ ] ERD 다이어그램 작성
- [ ] 테이블 구조 정의
  - [ ] `news` - 뉴스 기사
  - [ ] `stocks` - 종목 정보
  - [ ] `sectors` - 섹터 데이터
  - [ ] `macro_indicators` - 매크로 지표
  - [ ] `tags` - 태그 마스터
  - [ ] `news_tags` - 뉴스-태그 관계
  - [ ] `stock_prices` - 주가 히스토리
  - [ ] `user_portfolios` - 사용자 포트폴리오
- [ ] 인덱스 전략 수립

#### 2.1.2 SQLAlchemy 모델 생성
```python
# backend/app/models/
├── __init__.py
├── base.py          # Base 모델
├── news.py          # 뉴스 모델
├── stock.py         # 주식 모델
├── sector.py        # 섹터 모델
├── macro.py         # 매크로 모델
├── tag.py           # 태그 모델
└── user.py          # 사용자 모델
```

**작업 내용:**
- [ ] Base 모델 클래스 생성
- [ ] News 모델 (제목, 내용, 감성, 태그 등)
- [ ] Stock 모델 (심볼, 이름, 섹터, 52주 고저 등)
- [ ] Sector 모델 (이름, 심볼, 퍼포먼스)
- [ ] MacroIndicator 모델 (이름, 값, 타입)
- [ ] Tag 모델 (다대다 관계)
- [ ] 관계(Relationship) 정의

#### 2.1.3 Alembic 마이그레이션
- [ ] Alembic 초기화
- [ ] 초기 마이그레이션 생성
- [ ] 마이그레이션 실행 스크립트

```bash
# 작업 명령어
alembic init alembic
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

#### 2.1.4 데이터베이스 서비스 레이어
- [ ] CRUD 유틸리티 생성
- [ ] 트랜잭션 관리
- [ ] 에러 핸들링

### 2.2 태그 시스템 구현
**우선순위: HIGH**

#### 2.2.1 태그 모델 및 관계
```python
# 태그 유형
- sector: 섹터 (기술, 금융, 헬스케어 등)
- ticker: 종목 심볼 (AAPL, MSFT 등)
- category: 카테고리 (earnings, m&a, policy, tech, market)
- sentiment: 감성 (positive, negative, neutral)
- region: 지역 (US, KR, EU, CN 등)
```

**작업 내용:**
- [ ] Tag 모델 생성 (이름, 타입, 슬러그)
- [ ] 다대다 관계 설정 (news_tags, stock_tags)
- [ ] 태그 자동 생성 로직 (AI 기반)
- [ ] 태그 검색 최적화 (인덱스)

#### 2.2.2 태그 기반 검색 API
- [ ] `/api/news?tags=기술,AAPL`
- [ ] `/api/news?category=earnings`
- [ ] `/api/news?sentiment=positive`
- [ ] 복합 필터 지원

#### 2.2.3 태그 관리 UI
- [ ] 태그 클라우드 컴포넌트
- [ ] 태그 필터링 UI
- [ ] 인기 태그 표시

### 2.3 Redis 캐시 구현
**우선순위: HIGH**

#### 2.3.1 캐시 인프라
- [ ] Redis 연결 설정
- [ ] 캐시 유틸리티 클래스 생성
- [ ] 캐시 키 네이밍 규칙 적용

#### 2.3.2 캐시 전략 구현
```python
# 캐시 대상 및 TTL
- 뉴스 리스트: 10분
- 섹터 데이터: 5분
- 매크로 지표: 1시간
- 52주 데이터: 1시간
- AI 분석 결과: 24시간
```

**작업 내용:**
- [ ] 뉴스 API 캐시 적용
- [ ] 섹터 API 캐시 적용
- [ ] 매크로 API 캐시 적용
- [ ] 52주 API 캐시 적용
- [ ] 캐시 무효화 로직

#### 2.3.3 캐시 모니터링
- [ ] 캐시 히트율 메트릭
- [ ] 캐시 크기 모니터링
- [ ] 캐시 키 관리 대시보드

### 2.4 데이터 수집 → DB 저장
**우선순위: HIGH**

- [ ] 뉴스 수집 후 DB 저장
- [ ] 매크로 지표 DB 저장
- [ ] 섹터 데이터 DB 저장
- [ ] 52주 데이터 DB 저장
- [ ] 중복 체크 로직
- [ ] 데이터 정합성 검증

---

## 🧪 Phase 3: 테스트 자동화 (진행 중 🔄)

### 3.1 Backend 테스트
**우선순위: HIGH**

#### 3.1.1 테스트 환경 설정
- [ ] pytest 설정
- [ ] 테스트 데이터베이스 설정
- [ ] Fixture 생성
- [ ] Mock 설정

#### 3.1.2 API 엔드포인트 테스트
```python
# backend/tests/api/
├── test_news.py          # 뉴스 API 테스트
├── test_sectors.py       # 섹터 API 테스트
├── test_macro.py         # 매크로 API 테스트
├── test_market.py        # 시장 API 테스트
├── test_week52.py        # 52주 API 테스트
└── test_portfolio.py     # 포트폴리오 API 테스트
```

**테스트 항목:**
- [ ] GET 요청 (200 응답)
- [ ] POST 요청 (201 생성)
- [ ] PUT/PATCH 요청 (200 업데이트)
- [ ] DELETE 요청 (204 삭제)
- [ ] 에러 케이스 (400, 404, 500)
- [ ] 페이지네이션
- [ ] 필터링/검색

#### 3.1.3 데이터 수집 테스트
```python
# backend/tests/collectors/
├── test_news_collector.py
├── test_macro_collector.py
├── test_market_collector.py
└── test_sector_collector.py
```

**테스트 항목:**
- [ ] API 호출 성공
- [ ] 데이터 파싱 정확성
- [ ] 에러 핸들링
- [ ] 재시도 로직
- [ ] 타임아웃 처리

#### 3.1.4 AI 분석 테스트
- [ ] GPT-4o-mini 호출 테스트
- [ ] 요약 품질 검증
- [ ] 감성 분석 정확도
- [ ] 태그 추출 검증
- [ ] API 비용 모니터링

#### 3.1.5 캐시 테스트
- [ ] 캐시 저장/조회
- [ ] 캐시 만료
- [ ] 캐시 무효화
- [ ] 캐시 히트/미스

### 3.2 Frontend 테스트
**우선순위: MEDIUM**

#### 3.2.1 테스트 환경 설정
- [ ] Jest + React Testing Library 설정
- [ ] Mock 데이터 생성
- [ ] API Mock 설정

#### 3.2.2 컴포넌트 테스트
```typescript
// frontend/__tests__/components/
├── dashboard/
│   ├── MarketOverview.test.tsx
│   ├── SectorHeatmap.test.tsx
│   └── NewsFeed.test.tsx
├── charts/
│   ├── SectorPerformanceChart.test.tsx
│   └── MacroChart.test.tsx
└── ui/
    ├── Card.test.tsx
    └── Tabs.test.tsx
```

**테스트 항목:**
- [ ] 렌더링 테스트
- [ ] 사용자 인터랙션
- [ ] API 호출 Mock
- [ ] 에러 상태 처리
- [ ] 로딩 상태 표시

#### 3.2.3 E2E 테스트 (선택)
- [ ] Playwright 설정
- [ ] 주요 사용자 플로우 테스트

### 3.3 테스트 자동화
**우선순위: HIGH**

- [ ] GitHub Actions CI/CD 설정
- [ ] PR 시 자동 테스트 실행
- [ ] 커버리지 리포트 생성
- [ ] 테스트 실패 시 배포 차단

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Backend Tests
        run: pytest --cov=app
      - name: Run Frontend Tests
        run: npm test -- --coverage
```

---

## 🤖 Phase 4: AI 기능 고도화 (계획 📝)

### 4.1 GPT-4o-mini 최적화
**우선순위: MEDIUM**

- [ ] 프롬프트 엔지니어링 개선
- [ ] 토큰 사용량 최적화
- [ ] 배치 처리 구현
- [ ] 실패 시 재시도 로직
- [ ] 비용 모니터링 대시보드

### 4.2 고급 분석 기능
**우선순위: LOW**

- [ ] 뉴스 클러스터링 (유사 뉴스 그룹화)
- [ ] 트렌드 예측 (시계열 분석)
- [ ] 종목 추천 시스템
- [ ] 포트폴리오 리스크 분석

### 4.3 다국어 지원
**우선순위: LOW**

- [ ] 한국어 뉴스 요약
- [ ] 영어 ↔ 한국어 번역
- [ ] 다국어 감성 분석

---

## 🔄 Phase 5: 실시간 기능 (계획 📝)

### 5.1 WebSocket 구현
**우선순위: MEDIUM**

- [ ] FastAPI WebSocket 설정
- [ ] 실시간 주가 스트리밍
- [ ] 실시간 뉴스 알림
- [ ] 실시간 매크로 지표 업데이트

### 5.2 Celery 스케줄링
**우선순위: HIGH**

```python
# 스케줄 계획
- 뉴스 수집: 매 1시간
- 주가 업데이트: 매 15분 (장중)
- 섹터 데이터: 매 30분
- 매크로 지표: 매 1시간
- 52주 데이터: 매일 장 마감 후
```

**작업 내용:**
- [ ] Celery 설정
- [ ] Beat 스케줄러 설정
- [ ] 태스크 정의
- [ ] 모니터링 (Flower)
- [ ] 실패 시 재시도 로직

### 5.3 알림 시스템
**우선순위: LOW**

- [ ] 이메일 알림
- [ ] Slack 알림
- [ ] 웹 푸시 알림
- [ ] 알림 설정 UI

---

## 👤 Phase 6: 사용자 기능 (계획 📝)

### 6.1 인증 시스템
**우선순위: MEDIUM**

- [ ] JWT 기반 로그인
- [ ] 회원가입 / 로그인 UI
- [ ] 비밀번호 재설정
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 권한 관리 (Role-based)

### 6.2 포트폴리오 기능
**우선순위: MEDIUM**

- [ ] 종목 추가/삭제
- [ ] 수익률 계산
- [ ] 포트폴리오 차트
- [ ] 섹터 분산 분석
- [ ] 리스크 지표 (샤프 비율, 베타 등)

### 6.3 알림 설정
**우선순위: LOW**

- [ ] 종목 가격 알림
- [ ] 뉴스 키워드 알림
- [ ] 매크로 지표 임계값 알림
- [ ] 포트폴리오 리밸런싱 알림

### 6.4 북마크 및 메모
**우선순위: LOW**

- [ ] 뉴스 북마크
- [ ] 종목 관심 목록
- [ ] 개인 메모 기능

---

## 📱 Phase 7: 모바일 앱 (계획 📝)

### 7.1 React Native 설정
**우선순위: LOW**

- [ ] Expo 프로젝트 생성
- [ ] 코드 공유 전략 (monorepo)
- [ ] 네이티브 모듈 설정

### 7.2 주요 화면 구현
**우선순위: LOW**

- [ ] 대시보드
- [ ] 뉴스 피드
- [ ] 섹터 분석
- [ ] 포트폴리오
- [ ] 설정

### 7.3 앱 스토어 배포
**우선순위: LOW**

- [ ] iOS 빌드
- [ ] Android 빌드
- [ ] App Store 제출
- [ ] Google Play 제출

---

## 🚀 Phase 8: 프로덕션 배포 (계획 📝)

### 8.1 인프라 설정
**우선순위: MEDIUM**

#### Frontend (Vercel)
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 도메인 연결
- [ ] CDN 설정

#### Backend (AWS/GCP)
- [ ] 컨테이너화 (Docker)
- [ ] ECS/Cloud Run 설정
- [ ] RDS/Cloud SQL 설정
- [ ] Redis ElastiCache 설정
- [ ] Load Balancer 설정

### 8.2 CI/CD 파이프라인
**우선순위: MEDIUM**

- [ ] GitHub Actions 설정
- [ ] 자동 테스트 → 배포
- [ ] Staging 환경
- [ ] 블루-그린 배포
- [ ] 롤백 전략

### 8.3 모니터링 및 로깅
**우선순위: HIGH**

- [ ] Sentry (에러 추적)
- [ ] CloudWatch/Stackdriver (로그)
- [ ] Grafana (메트릭 시각화)
- [ ] 알림 설정 (PagerDuty, Slack)

### 8.4 보안
**우선순위: HIGH**

- [ ] HTTPS 적용 (SSL/TLS)
- [ ] CORS 설정
- [ ] Rate Limiting
- [ ] API 키 로테이션
- [ ] 정기 보안 감사

---

## 📊 Phase 9: 분석 및 최적화 (계획 📝)

### 9.1 성능 최적화
**우선순위: MEDIUM**

- [ ] 데이터베이스 쿼리 최적화
- [ ] 인덱스 튜닝
- [ ] N+1 쿼리 해결
- [ ] CDN 활용
- [ ] 이미지 최적화

### 9.2 사용자 분석
**우선순위: LOW**

- [ ] Google Analytics 연동
- [ ] 사용자 행동 추적
- [ ] A/B 테스트 도구
- [ ] 대시보드 (Mixpanel, Amplitude)

### 9.3 비용 최적화
**우선순위: MEDIUM**

- [ ] API 호출 최적화
- [ ] 캐시 히트율 개선
- [ ] 인프라 비용 모니터링
- [ ] 예약 인스턴스 활용

---

## 🎨 Phase 10: UX 개선 (계획 📝)

### 10.1 고급 UI/UX
**우선순위: LOW**

- [ ] 다크 모드
- [ ] 커스터마이징 가능한 대시보드
- [ ] 드래그 앤 드롭 위젯
- [ ] 애니메이션 효과
- [ ] 반응형 개선

### 10.2 접근성
**우선순위: LOW**

- [ ] ARIA 레이블
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원
- [ ] 고대비 모드

---

## 📅 현재 작업 우선순위

### 🔥 긴급 (이번 주)
1. [ ] 데이터베이스 스키마 설계 및 구현
2. [ ] Redis 캐시 설정 및 적용
3. [ ] 태그 시스템 구현
4. [ ] 기본 테스트 작성

### 🚀 중요 (이번 달)
1. [ ] 데이터 수집 → DB 저장 로직 완성
2. [ ] AI 분석 (gpt-4o-mini) 최적화
3. [ ] API 엔드포인트 완성 및 테스트
4. [ ] Celery 스케줄링 설정

### 📋 일반 (다음 달)
1. [ ] 사용자 인증 시스템
2. [ ] 포트폴리오 기능 완성
3. [ ] 프로덕션 배포 준비
4. [ ] 모니터링 설정

---

## 🎯 성공 지표 (KPI)

### 기술 지표
- [ ] 테스트 커버리지 > 85%
- [ ] API 응답 시간 < 500ms (캐시 히트)
- [ ] 캐시 히트율 > 80%
- [ ] 에러율 < 1%
- [ ] 가용성 > 99.9%

### 비즈니스 지표
- [ ] 일일 활성 사용자 (DAU) 목표
- [ ] 뉴스 업데이트 주기 < 1시간
- [ ] AI 분석 정확도 > 90%
- [ ] 사용자 만족도 > 4.5/5

---

## 📝 메모

### 개발 시 주의사항
- GPT-4o-mini만 사용 (비용 절감)
- 모든 기능에 테스트 작성
- 캐시 전략 항상 고려
- 태그 시스템 일관성 유지
- 보안 규칙 준수

### 참고 문서
- `RULE.md` - 프로젝트 규칙
- `GETTING_STARTED.md` - 시작 가이드
- `API_GUIDE.md` - API 통합 가이드

---

**업데이트 날짜:** 2024-11-12  
**다음 리뷰:** 매주 월요일

