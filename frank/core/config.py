import os
from pydantic_settings import BaseSettings, SettingsConfigDict

_env_file = ".env.production" if os.getenv("APP_ENV") == "production" else ".env"


class Settings(BaseSettings):
    APP_ENV: str
    LOGFIRE_TOKEN: str
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    OPENROUTER_API_KEY: str
    HELICONE_API_KEY: str
    DATABASE_URL: str
    model_config = SettingsConfigDict(
        env_file=_env_file,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
