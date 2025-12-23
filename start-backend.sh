#!/bin/bash

cd "$(dirname "$0")/backend"

echo "🚀 Starting SimplyStock Backend Server..."
echo ""

# 가상환경 확인
if [ ! -f "venv/bin/python3" ]; then
    echo "❌ 가상환경을 찾을 수 없습니다."
    echo "다음 명령어로 가상환경을 생성하세요:"
    echo "python3 -m venv venv"
    exit 1
fi

# uvicorn 설치 확인
if ! ./venv/bin/python3 -c "import uvicorn" 2>/dev/null; then
    echo "⚠️  uvicorn이 설치되지 않았습니다. 설치 중..."
    ./venv/bin/pip install uvicorn
fi

# 서버 시작
echo "✅ 백엔드 서버를 시작합니다..."
echo "   URL: http://localhost:8001"
echo "   API 문서: http://localhost:8001/docs"
echo ""
echo "종료하려면 Ctrl+C를 누르세요"
echo ""

./venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload


