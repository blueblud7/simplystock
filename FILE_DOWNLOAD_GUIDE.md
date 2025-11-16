# 리포트 파일 다운로드 구현 가이드

## 현재 상황

- **PDF 파일 위치**: `/Users/blueming/.../Vibe/report/reports/.../리포트제목.pdf`
- **파일 개수**: 약 2,900개 이상의 PDF 파일
- **DB 필드**: `file_path`, `pdf_url` (현재 미사용)

## 구현 방법

### 방법 1: 로컬 파일 서빙 (개발/소규모용) ⭐ 추천 (초기)

**장점:**
- 구현 간단
- 추가 비용 없음
- 빠른 개발

**단점:**
- 서버 재시작 시 파일 경로 문제 가능
- 확장성 제한
- 보안 설정 필요

**구현:**
```python
# backend/app/main.py
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# 리포트 파일 디렉토리 마운트
REPORTS_DIR = Path("/Users/blueming/.../Vibe/report/reports")
app.mount("/api/reports/files", StaticFiles(directory=str(REPORTS_DIR)), name="reports")

# API에서 URL 생성
pdf_url = f"/api/reports/files/{file_path}"
```

### 방법 2: 직접 다운로드 API (보안 강화)

**장점:**
- 파일 경로 노출 방지
- 접근 제어 가능
- 로깅 가능

**단점:**
- 서버 부하 증가 가능
- 구현 복잡도 증가

**구현:**
```python
# backend/app/api/reports.py
@router.get("/{report_id}/download")
async def download_report(report_id: int):
    # 리포트 정보 조회
    # 파일 경로 확인
    # 파일 스트리밍 반환
    return FileResponse(file_path, filename=report_title)
```

### 방법 3: AWS S3 (프로덕션용) ⭐ 추천 (확장 시)

**장점:**
- 확장성 우수
- CDN 연동 가능 (CloudFront)
- 보안 설정 용이
- 자동 백업

**단점:**
- 초기 설정 필요
- 비용 발생

## AWS S3 비용 예상

### 현재 데이터 규모
- **PDF 파일**: 약 4,418개
- **실제 용량**: 약 3.8GB
- **파일당 평균**: 약 880KB

### AWS S3 비용 (서울 리전 기준, 2024)

#### 1. 스토리지 비용
- **S3 Standard**: $0.023/GB/월
- **3.8GB 저장 시**: 약 $0.087/월 (약 115원/월)

#### 2. 요청 비용
- **GET 요청**: $0.0004/1,000건
- **월 10,000건 다운로드**: $0.004 (약 5원/월)
- **월 100,000건 다운로드**: $0.04 (약 50원/월)

#### 3. 데이터 전송 비용
- **같은 리전 내**: 무료
- **리전 외 전송**: $0.09/GB (처음 10TB/월)
- **월 10GB 전송**: $0.9 (약 1,200원/월)

### 총 예상 비용 (월간) - 실제 데이터 기준 (3.8GB)

| 시나리오 | 스토리지 | 요청 | 전송 | **총액** |
|---------|---------|------|------|---------|
| **소규모** (1만건/월) | $0.087 | $0.004 | $0.1 | **$0.19** (약 250원) |
| **중규모** (5만건/월) | $0.087 | $0.02 | $0.5 | **$0.61** (약 800원) |
| **대규모** (10만건/월) | $0.087 | $0.04 | $1.0 | **$1.13** (약 1,500원) |

### AWS 프리 티어
- **스토리지**: 5GB 무료 (12개월)
- **요청**: 20,000 GET 요청 무료 (12개월)
- **전송**: 100GB 무료 (12개월)

**→ 초기 1년간 거의 무료 사용 가능!**

### 추가 고려사항

#### CloudFront (CDN) 추가 시
- **장점**: 전 세계 빠른 다운로드, 캐싱으로 S3 요청 비용 절감
- **비용**: $0.085/GB (처음 10TB/월)
- **추가 비용**: 약 $0.1-0.5/월 (소규모 기준)

#### S3 Intelligent-Tiering
- 자동으로 비용 최적화
- 거의 사용하지 않는 파일은 자동으로 저렴한 스토리지로 이동
- **추가 비용**: $0.0025/1,000개 객체/월

## 추천 구현 단계

### Phase 1: 로컬 파일 서빙 (현재)
```python
# 빠른 구현, 비용 없음
# 개발/테스트 환경에 적합
```

### Phase 2: AWS S3 마이그레이션 (사용자 증가 시)
```python
# boto3 사용
import boto3
s3 = boto3.client('s3')
# 파일 업로드 후 URL 생성
```

### Phase 3: CloudFront 추가 (글로벌 서비스 시)
```python
# CDN으로 전 세계 빠른 다운로드
# 캐싱으로 비용 절감
```

## 구현 예시 코드

### 로컬 파일 서빙
```python
# backend/app/main.py
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# 리포트 파일 디렉토리
REPORTS_BASE_DIR = Path("/Users/blueming/.../Vibe/report/reports")

app.mount(
    "/api/reports/files",
    StaticFiles(directory=str(REPORTS_BASE_DIR)),
    name="reports-files"
)
```

### S3 업로드 스크립트
```python
# scripts/upload_reports_to_s3.py
import boto3
from pathlib import Path

s3 = boto3.client('s3')
BUCKET_NAME = 'simplystock-reports'

def upload_report(file_path: Path):
    s3_key = str(file_path.relative_to(REPORTS_BASE_DIR))
    s3.upload_file(str(file_path), BUCKET_NAME, s3_key)
    
    # URL 생성 (만료 시간 설정 가능)
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': s3_key},
        ExpiresIn=3600  # 1시간
    )
    return url
```

## 보안 고려사항

1. **접근 제어**
   - 인증된 사용자만 다운로드 가능
   - JWT 토큰 검증

2. **파일 경로 검증**
   - 상대 경로 공격 방지
   - 파일 존재 여부 확인

3. **다운로드 제한**
   - IP별 다운로드 횟수 제한
   - Rate limiting

## 결론

- **현재 단계**: 로컬 파일 서빙 추천 (비용 없음, 빠른 구현)
- **확장 시**: AWS S3로 마이그레이션 (월 약 170-1,500원)
- **프리 티어**: 초기 1년간 거의 무료 사용 가능

