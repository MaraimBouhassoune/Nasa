import time
from typing import Any, Optional
from threading import Lock
from config import get_settings

settings = get_settings()

class CacheService:
    """
    Simple in-memory cache with TTL support
    """
    
    def __init__(self):
        self._cache = {}
        self._timestamps = {}
        self._lock = Lock()
        self.ttl = settings.cache_ttl_seconds
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        with self._lock:
            if key not in self._cache:
                return None
            
            # Check if expired
            if time.time() - self._timestamps[key] > self.ttl:
                del self._cache[key]
                del self._timestamps[key]
                return None
            
            return self._cache[key]
    
    def set(self, key: str, value: Any) -> None:
        """Set value in cache with current timestamp"""
        with self._lock:
            self._cache[key] = value
            self._timestamps[key] = time.time()
    
    def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()
            self._timestamps.clear()
    
    def size(self) -> int:
        """Get number of cached items"""
        with self._lock:
            return len(self._cache)
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count removed"""
        current_time = time.time()
        removed_count = 0
        
        with self._lock:
            expired_keys = [
                key for key, timestamp in self._timestamps.items()
                if current_time - timestamp > self.ttl
            ]
            
            for key in expired_keys:
                del self._cache[key]
                del self._timestamps[key]
                removed_count += 1
        
        return removed_count
