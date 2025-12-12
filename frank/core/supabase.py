from cachetools.func import cached, LRUCache
from supabase import create_client
from frank.core.config import settings


@cached(cache=LRUCache(maxsize=1))
def get_supabase_client():
    return create_client(
        settings.VITE_SUPABASE_URL,
        settings.VITE_SUPABASE_ANON_KEY,
    )
