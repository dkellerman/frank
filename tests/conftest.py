import os

# Set dummy env vars before any frank.* imports that trigger Settings()
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("LOGFIRE_TOKEN", "test")
os.environ.setdefault("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io")
os.environ.setdefault("UPSTASH_REDIS_REST_TOKEN", "test")
os.environ.setdefault("OPENROUTER_API_KEY", "test")
os.environ.setdefault("HELICONE_API_KEY", "test")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("PROMPTLAYER_API_KEY", "test")
