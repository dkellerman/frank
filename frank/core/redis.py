from functools import lru_cache
from upstash_redis.asyncio import Redis
from frank.core.config import settings


@lru_cache(maxsize=1)
def get_redis() -> Redis:
    return Redis(
        url=settings.UPSTASH_REDIS_REST_URL,
        token=settings.UPSTASH_REDIS_REST_TOKEN,
    )
