# 📊 페이지별 캐시 전략 분석 및 권장사항

## 현재 캐시 구현 상태

### 백엔드
- ✅ 인메모리 캐시 유틸리티 (`app/utils/cache.py`)
- ✅ 매크로 데이터: 6시간 캐시 (장 개장 시간 기준)
- ✅ 52주 데이터: 백그라운드 업데이트
- ⚠️ 일부 API만 캐시 적용

### 프론트엔드
- ❌ 클라이언트 사이드 캐시 없음
- ❌ React Query 등 캐시 라이브러리 미사용

---

## 페이지별 데이터 특성 분석

### 1. 📈 대시보드 (`/`)
**데이터 구성:**
- Market Overview (주요 지수)
- Macro Indicators (매크로 지표)
- 52 Week Highlights
- Sector Heatmap
- News Feed
- Report Highlights

**특성:**
- ✅ 여러 데이터 소스 통합
- ✅ 실시간성 중간 (장 중에는 자주 업데이트 필요)
- ✅ 사용자 개인화 없음 (공통 데이터)

**권장 캐시 전략:**
```
백엔드:
- Market Overview: 30초 (장 중) / 5분 (장 마감 후)
- Macro Indicators: 6시간 (이미 구현됨)
- 52 Week: 1시간
- Sector: 5분
- News: 1분
- Reports: 5분

프론트엔드 (React Query):
- staleTime: 30초
- cacheTime: 5분
- refetchOnWindowFocus: true (장 중)
- refetchInterval: 30초 (장 중만)
```

---

### 2. 🎯 52주 신고가/신저가 (`/52week`)
**데이터 구성:**
- 52주 신고가/신저가 종목 리스트
- 브레이크아웃 패턴 분석
- 시장 브레드스 분석

**특성:**
- ⚠️ 대량 데이터 처리 (500+ 종목)
- ✅ 업데이트 빈도 낮음 (하루 1-2회)
- ✅ 계산 비용 높음 (52주 범위 계산)

**권장 캐시 전략:**
```
백엔드:
- 기본 데이터: 1시간
- 통계 계산: 30분
- 백그라운드 업데이트: 장 마감 후 1회

프론트엔드:
- staleTime: 10분
- cacheTime: 30분
- refetchOnWindowFocus: false
- refetchInterval: false
```

---

### 3. 🌍 매크로 지표 (`/macro`)
**데이터 구성:**
- CNN Fear & Greed Index
- M2 Money Supply
- Fed Funds Rate
- VIX Index
- 금리/환율 히스토리

**특성:**
- ✅ 외부 API 의존 (FRED, Alternative.me)
- ✅ 업데이트 빈도 낮음 (하루 1-2회)
- ✅ API 호출 비용 고려 필요

**권장 캐시 전략:**
```
백엔드 (현재 구현):
- Overview: 6시간 ✅
- Fear & Greed: 1시간
- Interest Rates: 1시간
- Exchange Rates: 30분
- History 데이터: 24시간

프론트엔드:
- staleTime: 1시간
- cacheTime: 6시간
- refetchOnWindowFocus: false
- refetchInterval: false
```

---

### 4. 📰 뉴스 (`/news`)
**데이터 구성:**
- 뉴스 기사 목록
- 감성 분석
- 트렌딩 토픽

**특성:**
- ✅ 실시간성 높음 (새 뉴스 지속 추가)
- ✅ 데이터 크기 중간 (페이징)
- ✅ 사용자 개인화 없음

**권장 캐시 전략:**
```
백엔드:
- 최신 뉴스 (최근 1시간): 1분
- 일반 뉴스: 5분
- 트렌딩 토픽: 10분

프론트엔드:
- staleTime: 30초
- cacheTime: 5분
- refetchOnWindowFocus: true
- refetchInterval: 1분 (최신 뉴스만)
```

---

### 5. 📊 섹터 분석 (`/sectors`)
**데이터 구성:**
- 11개 섹터 실시간 수익률
- 일별/주별/월별 히스토리
- 섹터 로테이션 인사이트

**특성:**
- ✅ 실시간성 높음 (장 중)
- ✅ 데이터 크기 작음
- ✅ 계산 비용 낮음

**권장 캐시 전략:**
```
백엔드:
- 실시간 수익률: 30초 (장 중) / 5분 (장 마감 후)
- 히스토리 데이터: 1시간
- 인사이트: 10분

프론트엔드:
- staleTime: 30초
- cacheTime: 5분
- refetchOnWindowFocus: true
- refetchInterval: 30초 (장 중만)
```

---

### 6. 💼 종목별 리포트 (`/stocks`)
**데이터 구성:**
- 종목 목록
- 종목별 리포트 히스토리
- 목표가 변화 추이

**특성:**
- ⚠️ 대량 데이터 (500+ 종목)
- ✅ 업데이트 빈도 낮음 (리포트 발행 시)
- ⚠️ 복잡한 쿼리 (JOIN, 서브쿼리)

**권장 캐시 전략:**
```
백엔드:
- 종목 목록: 10분
- 종목 상세: 5분
- 리포트 히스토리: 30분

프론트엔드:
- staleTime: 5분
- cacheTime: 30분
- refetchOnWindowFocus: false
- refetchInterval: false
```

---

### 7. 📄 증권사 리포트 (`/reports`)
**데이터 구성:**
- 리포트 목록
- 리포트 상세
- 증권사/애널리스트 순위

**특성:**
- ✅ 업데이트 빈도 낮음 (하루 1-2회)
- ✅ 데이터 크기 중간
- ✅ 검색/필터 기능

**권장 캐시 전략:**
```
백엔드:
- 리포트 목록: 10분
- 리포트 상세: 30분
- 순위 데이터: 1시간

프론트엔드:
- staleTime: 5분
- cacheTime: 30분
- refetchOnWindowFocus: false
- refetchInterval: false
```

---

### 8. 💼 포트폴리오 (`/portfolio`)
**데이터 구성:**
- 사용자 보유 종목
- 평가 손익
- 포트폴리오 통계

**특성:**
- ✅ 사용자 개인화 데이터
- ✅ 실시간성 높음 (현재가 업데이트)
- ✅ 로컬 스토리지 사용 중

**권장 캐시 전략:**
```
백엔드:
- 현재가 조회: 10초 (장 중) / 1분 (장 마감 후)
- 종목 정보: 1시간

프론트엔드:
- staleTime: 10초
- cacheTime: 1분
- refetchOnWindowFocus: true
- refetchInterval: 10초 (장 중만)
- 로컬 스토리지와 동기화
```

---

## 🎯 종합 권장사항

### 백엔드 캐시 전략

#### 1. 계층적 캐시 구조
```
L1: 인메모리 캐시 (현재 구현)
  - 빠른 응답 (마이크로초)
  - 서버 재시작 시 초기화
  - 용량 제한

L2: Redis 캐시 (권장 추가)
  - 분산 환경 지원
  - 영구 저장
  - 더 긴 TTL 가능
```

#### 2. 캐시 키 전략
```python
# 패턴: {resource}:{params}:{version}
"market:overview:v1"
"macro:fear_greed:v1"
"stocks:list:page1:size25:v1"
"news:recent:page1:v1"
```

#### 3. 캐시 무효화 전략
- **Time-based**: TTL 기반 자동 만료
- **Event-based**: 데이터 업데이트 시 수동 무효화
- **Version-based**: API 버전 변경 시 전체 무효화

#### 4. 백그라운드 갱신 (Cache-Aside Pattern)
```python
# 캐시 만료 전에 백그라운드에서 미리 갱신
if cache_age > TTL * 0.8:  # 80% 경과 시
    background_refresh()
```

---

### 프론트엔드 캐시 전략

#### 1. React Query 도입 (권장)
```typescript
// 설치
npm install @tanstack/react-query

// 기본 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,  // 30초
      cacheTime: 5 * 60 * 1000,  // 5분
      refetchOnWindowFocus: true,
    },
  },
});
```

#### 2. 페이지별 설정 예시
```typescript
// 대시보드 - 실시간 데이터
useQuery({
  queryKey: ['market', 'overview'],
  queryFn: fetchMarketOverview,
  staleTime: 30 * 1000,
  refetchInterval: 30 * 1000,  // 장 중만
});

// 매크로 - 장기 캐시
useQuery({
  queryKey: ['macro', 'overview'],
  queryFn: fetchMacroOverview,
  staleTime: 60 * 60 * 1000,  // 1시간
  cacheTime: 6 * 60 * 60 * 1000,  // 6시간
});

// 뉴스 - 짧은 캐시
useQuery({
  queryKey: ['news', 'list', page],
  queryFn: () => fetchNews(page),
  staleTime: 30 * 1000,
  refetchInterval: 60 * 1000,
});
```

#### 3. 브라우저 캐시 활용
```typescript
// HTTP 헤더 설정 (백엔드)
Cache-Control: public, max-age=300  // 5분
ETag: "version-hash"
Last-Modified: timestamp
```

---

## 📈 성능 개선 예상 효과

### 캐시 적용 전
- API 응답 시간: 200-500ms
- 서버 부하: 높음
- 사용자 경험: 로딩 대기 필요

### 캐시 적용 후 (예상)
- API 응답 시간: 5-20ms (캐시 히트 시)
- 서버 부하: 70-90% 감소
- 사용자 경험: 즉시 표시, 부드러운 UX

---

## 🚀 구현 우선순위

### Phase 1: 즉시 적용 (High Impact)
1. ✅ Market Overview: 30초 캐시
2. ✅ Sector Performance: 30초 캐시
3. ✅ News: 1분 캐시
4. ✅ Reports: 10분 캐시

### Phase 2: 중기 개선
1. React Query 도입
2. Redis 캐시 추가
3. 백그라운드 갱신 구현

### Phase 3: 장기 최적화
1. CDN 캐싱 (정적 데이터)
2. Service Worker (오프라인 지원)
3. 스마트 프리페칭

---

## ⚠️ 주의사항

1. **데이터 일관성**: 캐시된 데이터가 최신이 아닐 수 있음
2. **메모리 관리**: 인메모리 캐시는 메모리 사용량 모니터링 필요
3. **캐시 무효화**: 데이터 업데이트 시 적절한 무효화 필수
4. **에러 처리**: 캐시 실패 시 원본 데이터 소스로 폴백

---

## 📊 모니터링 지표

- 캐시 히트율 (목표: 70%+)
- 평균 응답 시간
- 서버 CPU/메모리 사용량
- API 호출 빈도
- 사용자 체감 성능






