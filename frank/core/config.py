from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str
    LOGFIRE_TOKEN: str
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    OPENROUTER_API_KEY: str
    HELICONE_API_KEY: str
    VITE_SUPABASE_URL: str
    VITE_SUPABASE_ANON_KEY: str
    PROMPTLAYER_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
