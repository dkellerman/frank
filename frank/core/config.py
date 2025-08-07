from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    APP_ENV: str = "development"
    LOGFIRE_TOKEN: str | None = None
    GOOGLE_API_KEY: str | None = None
    UPSTASH_REDIS_REST_URL: str | None = None
    UPSTASH_REDIS_REST_TOKEN: str | None = None
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    GROK_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

# Ensure provider keys from .env are available to libraries that read from os.environ
for _key in (
    "GOOGLE_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GROQ_API_KEY",
    "GROK_API_KEY",
):
    _val = getattr(settings, _key, None)
    if _val:
        os.environ.setdefault(_key, _val)
