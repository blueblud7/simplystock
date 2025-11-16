"""
간단한 인메모리 캐시 유틸리티
"""
from datetime import datetime, timedelta
from typing import Any, Optional, Callable
from functools import wraps
import asyncio

# 캐시 저장소
_cache = {}

class CacheEntry:
    def __init__(self, value: Any, expires_at: datetime):
        self.value = value
        self.expires_at = expires_at
    
    def is_expired(self) -> bool:
        return datetime.now() >= self.expires_at

def get_cache(key: str) -> Optional[Any]:
    """캐시에서 값 가져오기"""
    if key in _cache:
        entry = _cache[key]
        if not entry.is_expired():
            return entry.value
        else:
            # 만료된 항목 삭제
            del _cache[key]
    return None

def set_cache(key: str, value: Any, ttl_seconds: int = 60):
    """캐시에 값 저장"""
    expires_at = datetime.now() + timedelta(seconds=ttl_seconds)
    _cache[key] = CacheEntry(value, expires_at)

def clear_cache(key: Optional[str] = None):
    """캐시 삭제"""
    if key:
        if key in _cache:
            del _cache[key]
    else:
        _cache.clear()

def cache_result(ttl_seconds: int = 60, key_prefix: str = ""):
    """
    함수 결과를 캐시하는 데코레이터
    
    Args:
        ttl_seconds: 캐시 유지 시간 (초)
        key_prefix: 캐시 키 prefix
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # 캐시 키 생성
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 캐시에서 확인
            cached = get_cache(cache_key)
            if cached is not None:
                print(f"✅ 캐시 히트: {cache_key}")
                return cached
            
            # 캐시 미스 - 함수 실행
            print(f"❌ 캐시 미스: {cache_key}")
            result = await func(*args, **kwargs)
            
            # 결과 캐시에 저장
            set_cache(cache_key, result, ttl_seconds)
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # 캐시 키 생성
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 캐시에서 확인
            cached = get_cache(cache_key)
            if cached is not None:
                print(f"✅ 캐시 히트: {cache_key}")
                return cached
            
            # 캐시 미스 - 함수 실행
            print(f"❌ 캐시 미스: {cache_key}")
            result = func(*args, **kwargs)
            
            # 결과 캐시에 저장
            set_cache(cache_key, result, ttl_seconds)
            return result
        
        # async 함수인지 확인
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

