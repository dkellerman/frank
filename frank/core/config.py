from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    APP_ENV: str = "development"
    LOGFIRE_TOKEN: str | None = None
    UPSTASH_REDIS_REST_URL: str | None = None
    UPSTASH_REDIS_REST_TOKEN: str | None = None
    OPENROUTER_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

# Ensure provider keys from .env are available to libraries that read from os.environ
for _key in (
    "OPENROUTER_API_KEY",
):
    _val = getattr(settings, _key, None)
    if _val:
        os.environ.setdefault(_key, _val)
