from cachetools import cached, LRUCache
from upstash_redis.asyncio import Redis
from frank.core.config import settings


@cached(cache=LRUCache(maxsize=1))
def get_redis() -> Redis:
    return Redis(
        url=settings.UPSTASH_REDIS_REST_URL,
        token=settings.UPSTASH_REDIS_REST_TOKEN,
    )
