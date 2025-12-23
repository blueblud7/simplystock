#!/usr/bin/env python3
"""백엔드 서버 시작 스크립트"""
import subprocess
import sys
import os

# 현재 디렉토리를 backend로 설정
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("🚀 Starting SimplyStock Backend Server...")
print("   URL: http://localhost:8001")
print("   API 문서: http://localhost:8001/docs")
print("")
print("종료하려면 Ctrl+C를 누르세요")
print("")

try:
    # uvicorn 실행
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8001",
        "--reload"
    ])
except KeyboardInterrupt:
    print("\n👋 서버를 종료합니다...")
except Exception as e:
    print(f"❌ 에러 발생: {e}")
    sys.exit(1)


