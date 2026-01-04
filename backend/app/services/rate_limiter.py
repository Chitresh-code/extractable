"""
Rate limiting service with queue and exponential backoff.
Tracks RPM, TPM, and RPD per user.
"""

import time
import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta
from collections import deque
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings


class RateLimitError(Exception):
    """Exception raised when rate limit is exceeded."""
    pass


class RateLimiter:
    """
    Rate limiter with per-user tracking.
    Tracks requests per minute (RPM), tokens per minute (TPM), and requests per day (RPD).
    """
    
    def __init__(self):
        # Per-user tracking
        self.user_rpm: Dict[int, deque] = {}  # user_id -> deque of request timestamps
        self.user_tpm: Dict[int, deque] = {}  # user_id -> deque of (timestamp, tokens)
        self.user_rpd: Dict[int, int] = {}  # user_id -> request count today
        self.user_rpd_date: Dict[int, datetime] = {}  # user_id -> date of last reset
        
        # Queue for rate-limited requests
        self.request_queue: asyncio.Queue = asyncio.Queue()
        self.processing = False
    
    def _reset_daily_counters(self, user_id: int):
        """Reset daily request counter if it's a new day."""
        today = datetime.now().date()
        last_date = self.user_rpd_date.get(user_id)
        
        if last_date is None or last_date.date() < today:
            self.user_rpd[user_id] = 0
            self.user_rpd_date[user_id] = datetime.now()
    
    def _clean_old_requests(self, user_id: int, window_seconds: int = 60):
        """Remove request timestamps older than the time window."""
        now = time.time()
        cutoff = now - window_seconds
        
        if user_id in self.user_rpm:
            while self.user_rpm[user_id] and self.user_rpm[user_id][0] < cutoff:
                self.user_rpm[user_id].popleft()
        
        if user_id in self.user_tpm:
            while self.user_tpm[user_id] and self.user_tpm[user_id][0][0] < cutoff:
                self.user_tpm[user_id].popleft()
    
    def check_rate_limit(self, user_id: int, tokens: int = 0) -> bool:
        """
        Check if user has exceeded rate limits.
        
        Args:
            user_id: User ID
            tokens: Number of tokens in the request
            
        Returns:
            True if within limits, False otherwise
        """
        now = time.time()
        
        # Reset daily counters if needed
        self._reset_daily_counters(user_id)
        
        # Clean old requests
        self._clean_old_requests(user_id)
        
        # Initialize tracking if needed
        if user_id not in self.user_rpm:
            self.user_rpm[user_id] = deque()
        if user_id not in self.user_tpm:
            self.user_tpm[user_id] = deque()
        if user_id not in self.user_rpd:
            self.user_rpd[user_id] = 0
        
        # Check RPM (Requests Per Minute)
        if len(self.user_rpm[user_id]) >= settings.rate_limit_rpm:
            return False
        
        # Check TPM (Tokens Per Minute)
        total_tokens = sum(t for _, t in self.user_tpm[user_id])
        if total_tokens + tokens > settings.rate_limit_tpm:
            return False
        
        # Check RPD (Requests Per Day)
        if self.user_rpd[user_id] >= settings.rate_limit_rpd:
            return False
        
        return True
    
    def record_request(self, user_id: int, tokens: int = 0):
        """
        Record a request for rate limiting tracking.
        
        Args:
            user_id: User ID
            tokens: Number of tokens in the request
        """
        now = time.time()
        
        # Initialize if needed
        if user_id not in self.user_rpm:
            self.user_rpm[user_id] = deque()
        if user_id not in self.user_tpm:
            self.user_tpm[user_id] = deque()
        if user_id not in self.user_rpd:
            self.user_rpd[user_id] = 0
        
        # Record request
        self.user_rpm[user_id].append(now)
        self.user_tpm[user_id].append((now, tokens))
        self.user_rpd[user_id] += 1
    
    async def wait_for_rate_limit(self, user_id: int, tokens: int = 0) -> float:
        """
        Wait if rate limit is exceeded, return wait time in seconds.
        
        Args:
            user_id: User ID
            tokens: Number of tokens in the request
            
        Returns:
            Wait time in seconds (0 if no wait needed)
        """
        if self.check_rate_limit(user_id, tokens):
            return 0.0
        
        # Calculate wait time based on RPM
        if user_id in self.user_rpm and self.user_rpm[user_id]:
            oldest_request = self.user_rpm[user_id][0]
            wait_time = 60 - (time.time() - oldest_request)
            return max(0.0, wait_time)
        
        return 1.0  # Default 1 second wait


# Global rate limiter instance
rate_limiter = RateLimiter()


@retry(
    stop=stop_after_attempt(settings.max_retries),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    retry=retry_if_exception_type(RateLimitError)
)
async def make_rate_limited_request(user_id: int, tokens: int, func, *args, **kwargs):
    """
    Make a request with rate limiting and exponential backoff retry.
    
    Args:
        user_id: User ID
        tokens: Number of tokens in the request
        func: Function to call
        *args, **kwargs: Arguments for the function
        
    Returns:
        Result of the function call
    """
    # Wait if rate limit is exceeded
    wait_time = await rate_limiter.wait_for_rate_limit(user_id, tokens)
    if wait_time > 0:
        await asyncio.sleep(wait_time)
    
    # Check again before making request
    if not rate_limiter.check_rate_limit(user_id, tokens):
        raise RateLimitError(f"Rate limit exceeded for user {user_id}")
    
    # Make the request
    result = await func(*args, **kwargs)
    
    # Record the request
    rate_limiter.record_request(user_id, tokens)
    
    return result

