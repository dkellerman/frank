from frank.core.config import settings
from frank.core.redis import get_redis as _get_redis


def get_settings():
    return settings


async def get_redis():
    return _get_redis()
