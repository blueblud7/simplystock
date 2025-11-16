# 네이버 링크 사용 분석

## 현재 상황

### DB 구조
- `sent_reports` 테이블에 `pdf_url` 컬럼 존재
- 리포트 수집 시 네이버 금융에서 `pdf_url` 수집
- 예시: `https://finance.naver.com/research/company_read.naver?nid=123456&page=1`

### 네이버 링크 형태
```python
# main.py에서 수집하는 링크 형태
pdf_url = file_cell['href']
if not pdf_url.startswith("http"):
    pdf_url = "https://finance.naver.com" + pdf_url
```

## 네이버 링크 직접 사용 방법

### 장점 ✅
1. **서버 부하 없음**: 파일을 직접 서빙하지 않아도 됨
2. **비용 절감**: 스토리지/전송 비용 없음
3. **구현 간단**: 링크만 프론트엔드에 전달
4. **최신 파일**: 네이버에서 직접 제공하는 원본

### 구현 방법

#### 1. 프론트엔드에서 직접 링크 사용
```tsx
// frontend/components/reports/report-detail-modal.tsx
{report?.pdf_url && (
  <a 
    href={report.pdf_url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-primary hover:underline"
  >
    <ExternalLink className="h-4 w-4" />
    네이버에서 리포트 보기
  </a>
)}
```

#### 2. 백엔드에서 링크만 반환 (이미 구현됨)
```python
# backend/app/api/reports.py
# pdf_url이 이미 Report 모델에 포함되어 있음
```

## 잠재적 문제점 및 해결책

### 1. 링크 만료/변경 가능성 ⚠️

**문제:**
- 네이버가 링크 구조를 변경할 수 있음
- 리포트가 삭제되거나 이동될 수 있음
- `nid` 파라미터 기반 링크가 만료될 수 있음

**확인 필요:**
```bash
# 실제 링크가 작동하는지 테스트
curl -I "https://finance.naver.com/research/company_read.naver?nid=123456"
```

**해결책:**
- 정기적으로 링크 유효성 검사
- 링크 실패 시 로컬 파일로 폴백
- 링크 상태 모니터링

### 2. CORS (Cross-Origin Resource Sharing) 문제 ⚠️

**문제:**
- 네이버 금융이 CORS 헤더를 허용하지 않을 수 있음
- 브라우저에서 직접 접근은 가능하지만, iframe 임베딩은 불가능할 수 있음

**해결책:**
- `target="_blank"`로 새 탭에서 열기 (권장)
- iframe 대신 링크 사용
- 프록시 서버 사용 (복잡함)

### 3. 접근 제한 가능성 ⚠️

**문제:**
- 네이버가 특정 IP/User-Agent 차단 가능
- 로봇 차단 정책 변경 가능
- Referer 체크 가능

**해결책:**
- User-Agent 헤더 설정
- Referer 헤더 설정 (이미 구현됨)
```python
headers = {
    'User-Agent': 'Mozilla/5.0...',
    'Referer': 'https://finance.naver.com/'
}
```

### 4. 링크 구조 변경 가능성 ⚠️

**문제:**
- 네이버가 URL 구조를 변경하면 기존 링크가 작동하지 않음
- 예: `/research/company_read.naver` → `/research/company/view.naver`

**해결책:**
- 링크 유효성 검사 스크립트 작성
- 링크 실패 시 로컬 파일로 폴백
- 정기적인 링크 업데이트

### 5. 법적/정책적 문제 ⚠️

**문제:**
- 네이버 서비스 약관 위반 가능성
- 직접 링크 사용에 대한 제한 가능
- 저작권 문제 (리포트는 증권사 소유)

**확인 필요:**
- 네이버 금융 서비스 약관 확인
- 리포트 저작권 확인

**해결책:**
- 링크 사용 시 "네이버 금융에서 제공" 명시
- 원본 출처 표기
- 필요 시 증권사와 협의

### 6. 성능 문제 (낮은 가능성) ✅

**문제:**
- 네이버 서버 부하로 인한 느린 로딩
- 네이버 다운타임 시 접근 불가

**해결책:**
- 로컬 파일로 폴백
- 타임아웃 설정
- 재시도 로직

## 하이브리드 접근법 (권장) ⭐

### 1순위: 네이버 링크 사용
- `pdf_url`이 있고 유효하면 네이버 링크 사용

### 2순위: 로컬 파일 폴백
- `pdf_url`이 없거나 실패 시 로컬 파일 사용
- `file_path` 기반으로 로컬 파일 서빙

### 구현 예시
```python
# backend/app/api/reports.py
@router.get("/{report_id}/download")
async def download_report(report_id: int):
    report = get_report_detail(report_id)
    
    # 1순위: 네이버 링크
    if report.get("pdf_url"):
        return {
            "type": "external",
            "url": report["pdf_url"],
            "source": "naver"
        }
    
    # 2순위: 로컬 파일
    if report.get("file_path"):
        file_path = REPORTS_DIR / report["file_path"]
        if file_path.exists():
            return FileResponse(
                file_path,
                filename=f"{report['title']}.pdf"
            )
    
    raise HTTPException(404, "리포트 파일을 찾을 수 없습니다")
```

```tsx
// frontend
const handleDownload = async () => {
  const response = await fetch(`/api/reports/${reportId}/download`);
  const data = await response.json();
  
  if (data.type === "external") {
    // 네이버 링크로 새 탭 열기
    window.open(data.url, "_blank");
  } else {
    // 로컬 파일 다운로드
    // ...
  }
};
```

## 모니터링 및 유지보수

### 정기 점검 항목
1. **링크 유효성 검사** (월 1회)
   ```python
   # scripts/check_naver_links.py
   # 랜덤 샘플링하여 링크 작동 여부 확인
   ```

2. **링크 실패율 모니터링**
   - 실패율이 10% 이상이면 로컬 파일로 전환 고려

3. **네이버 정책 변경 모니터링**
   - 서비스 약관 변경 확인
   - robots.txt 확인

## 결론 및 추천

### ✅ 네이버 링크 사용 추천
- **비용 절감**: 서버 부하 없음
- **구현 간단**: 링크만 전달
- **최신 파일**: 네이버에서 직접 제공

### ⚠️ 주의사항
1. **하이브리드 접근**: 네이버 링크 + 로컬 파일 폴백
2. **정기 모니터링**: 링크 유효성 검사
3. **법적 확인**: 네이버 서비스 약관 확인

### 📋 구현 우선순위
1. **즉시**: 네이버 링크 사용 (이미 `pdf_url` 필드 존재)
2. **단기**: 로컬 파일 폴백 추가
3. **중기**: 링크 유효성 검사 스크립트
4. **장기**: 모니터링 대시보드

## 테스트 방법

```bash
# 1. DB에서 실제 링크 확인
sqlite3 reports.db "SELECT pdf_url FROM sent_reports WHERE pdf_url IS NOT NULL LIMIT 1;"

# 2. 링크 접근 테스트
curl -I "실제_링크_URL"

# 3. 브라우저에서 직접 접근 테스트
# 새 탭에서 링크 열어보기
```

