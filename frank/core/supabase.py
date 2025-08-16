from supabase import create_client
from frank.core.config import settings

supabase_client = create_client(
    settings.VITE_SUPABASE_URL,
    settings.VITE_SUPABASE_ANON_KEY,
)
