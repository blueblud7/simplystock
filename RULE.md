# 📋 SimplyStock 프로젝트 규칙

## 🤖 AI 사용 규칙

### GPT 모델 선택
- **필수**: `gpt-4o-mini` 사용
- **이유**: 비용 효율성과 충분한 성능
- **금지**: `gpt-4` 또는 다른 고비용 모델 사용 금지

```python
# ✅ 올바른 사용
response = openai.ChatCompletion.create(
    model="gpt-4o-mini",  # 반드시 이 모델 사용
    messages=[...]
)

# ❌ 잘못된 사용
response = openai.ChatCompletion.create(
    model="gpt-4",  # 비용이 너무 높음
    messages=[...]
)
```

### AI 사용 범위
- 뉴스 요약 (최대 3문장)
- 감성 분석 (positive/negative/neutral)
- 관련 종목 태깅
- 카테고리 분류

---

## 🧪 테스트 규칙

### 자동 테스트 필수
모든 기능은 반드시 자동 테스트를 작성해야 합니다.

**Backend (pytest)**
```bash
# 테스트 실행
pytest backend/tests/

# 커버리지 확인
pytest --cov=app --cov-report=html
```

**Frontend (Jest)**
```bash
# 테스트 실행
npm test

# 커버리지 확인
npm test -- --coverage
```

### 테스트 커버리지 목표
- **최소**: 70%
- **목표**: 85%
- **이상**: 95%

### 필수 테스트 항목
- ✅ API 엔드포인트 (모든 라우터)
- ✅ 데이터 수집 스크립트
- ✅ AI 분석 로직
- ✅ 캐시 동작
- ✅ 데이터베이스 CRUD
- ✅ 프론트엔드 컴포넌트

---

## 💾 데이터베이스 규칙

### 태그 시스템
모든 컨텐츠(뉴스, 리포트 등)는 반드시 태그를 가져야 합니다.

**필수 태그 유형:**
- `sector`: 섹터 (기술, 금융, 헬스케어 등)
- `ticker`: 종목 심볼 (AAPL, MSFT 등)
- `category`: 카테고리 (earnings, m&a, policy, tech, market)
- `sentiment`: 감성 (positive, negative, neutral)
- `region`: 지역 (US, KR, EU, CN 등)

**예시:**
```python
news_article = {
    "title": "애플, AI 칩 개발 발표",
    "tags": {
        "sector": ["기술"],
        "ticker": ["AAPL"],
        "category": "tech",
        "sentiment": "positive",
        "region": "US"
    }
}
```

### 데이터 정합성
- ✅ 모든 외래 키는 인덱스 추가
- ✅ 필수 필드는 NOT NULL 제약조건
- ✅ 중복 데이터는 UNIQUE 제약조건
- ✅ 날짜 필드는 UTC timezone 사용

---

## 🚀 성능 규칙

### 캐시 전략 (Redis)

**반드시 캐시해야 하는 데이터:**
1. **뉴스 리스트** - 10분 캐시
2. **섹터 데이터** - 5분 캐시
3. **매크로 지표** - 1시간 캐시
4. **52주 데이터** - 1시간 캐시
5. **AI 분석 결과** - 24시간 캐시

**캐시 키 네이밍:**
```python
# 패턴: {resource}:{id}:{param}
"news:list:page:1:sentiment:positive"
"sector:XLK:performance"
"macro:fear_greed:latest"
"stock:AAPL:52week"
```

**캐시 무효화:**
- 새 데이터 수집 시 관련 캐시 삭제
- 에러 발생 시 캐시 스킵
- 개발 모드에서는 캐시 비활성화 옵션

```python
# ✅ 올바른 캐시 사용
@cache.cached(timeout=600, key_prefix='news_list')
async def get_news_list():
    return await db.query(News).all()

# ✅ 캐시 무효화
@router.post("/news")
async def create_news(article: NewsCreate):
    result = await db.add(article)
    cache.delete('news_list')  # 캐시 무효화
    return result
```

### API 성능
- ✅ 응답 시간 < 500ms (캐시 히트)
- ✅ 응답 시간 < 2초 (캐시 미스)
- ✅ 페이지네이션 필수 (최대 100개/페이지)
- ✅ 무한 스크롤 금지 (서버 부하)

---

## 🔒 보안 규칙

### API 키 관리
- ✅ `.env` 파일에만 저장
- ✅ Git에 절대 커밋 금지
- ✅ `.env.example` 템플릿만 커밋
- ✅ 환경변수로만 접근

### 사용자 데이터
- ✅ 비밀번호는 bcrypt 해싱
- ✅ JWT 토큰 1시간 만료
- ✅ Refresh 토큰 7일 만료
- ✅ 민감 정보는 로그 금지

---

## 📝 코드 스타일

### Python (Backend)
```python
# Black formatter 사용
black backend/

# Import 정렬
isort backend/

# Linting
flake8 backend/

# Type hints 필수
def get_news(page: int = 1) -> List[News]:
    ...
```

### TypeScript (Frontend)
```typescript
// Prettier 사용
npm run format

// ESLint
npm run lint

// Type 안전성
const news: NewsArticle[] = await getNews();
```

### 네이밍 규칙
- **변수/함수**: `snake_case` (Python), `camelCase` (TS)
- **클래스**: `PascalCase`
- **상수**: `UPPER_SNAKE_CASE`
- **파일명**: `kebab-case` (Frontend), `snake_case` (Backend)

---

## 🔄 Git 규칙

### 커밋 메시지
```
<type>: <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드/설정 변경

**예시:**
```
feat: 뉴스 감성 분석 API 추가

- OpenAI gpt-4o-mini 사용
- 긍정/부정/중립 분류
- Redis 캐시 적용 (10분)

Closes #123
```

### 브랜치 전략
- `main`: 프로덕션
- `develop`: 개발 중
- `feature/*`: 새 기능
- `fix/*`: 버그 수정
- `hotfix/*`: 긴급 수정

---

## 📊 모니터링 규칙

### 로깅
```python
import logging

# 로그 레벨
# DEBUG: 개발 중 상세 정보
# INFO: 일반 정보
# WARNING: 경고 (주의 필요)
# ERROR: 에러 (기능 실패)
# CRITICAL: 심각한 에러 (서비스 중단)

logger.info("뉴스 수집 시작")
logger.error(f"API 호출 실패: {e}")
```

### 필수 메트릭
- API 응답 시간
- 데이터베이스 쿼리 시간
- 캐시 히트율
- 에러율
- 동시 사용자 수

---

## 🚫 금지 사항

### 절대 하지 말 것
- ❌ 프로덕션에서 `DEBUG=True`
- ❌ API 키 하드코딩
- ❌ SQL Injection 가능 쿼리
- ❌ 무제한 API 요청
- ❌ 캐시 없이 반복 조회
- ❌ 테스트 없이 배포
- ❌ `print()` 디버깅 (logger 사용)
- ❌ 전역 변수 남발
- ❌ 긴 함수 (50줄 이상)
- ❌ 주석 없는 복잡한 로직

---

## ✅ 체크리스트

### 새 기능 추가 시
- [ ] 테스트 코드 작성
- [ ] 캐시 전략 고려
- [ ] 태그 시스템 적용
- [ ] API 문서 업데이트
- [ ] 에러 처리 추가
- [ ] 로깅 추가
- [ ] 성능 테스트
- [ ] 코드 리뷰 요청

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 캐버리지 70% 이상
- [ ] Linting 통과
- [ ] API 키 확인
- [ ] 데이터베이스 마이그레이션
- [ ] 환경 변수 설정
- [ ] 모니터링 설정
- [ ] 롤백 계획 수립

---

## 📞 문제 발생 시

1. **로그 확인** → 에러 메시지 분석
2. **테스트 실행** → 어느 부분이 깨졌는지 확인
3. **캐시 클리어** → Redis 초기화
4. **데이터베이스 확인** → 데이터 정합성
5. **API 키 확인** → 유효한지 체크
6. **이슈 등록** → 재현 가능한 버그 리포트

---

**이 규칙은 프로젝트 전체에 적용됩니다. 예외는 없습니다!** 🚨

