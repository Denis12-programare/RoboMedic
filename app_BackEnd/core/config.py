from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    FEATHERLESS_API_KEY: str = "rc_ab67858ff6c206aba4b48f49024317a6c19ae35e75bc289002a44de447a27b25"
    FEATHERLESS_BASE_URL: str = "https://api.featherless.ai/v1"
    FEATHERLESS_DEFAULT_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    FEATHERLESS_FAST_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    FEATHERLESS_LARGE_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    FEATHERLESS_IMAGE_MODEL: str = "google/gemma-3-27b-it"
    FEATHERLESS_MAX_CONCURRENT_REQUESTS: int = 4
    
    PROJECT_NAME: str = "RoboMedic AI Cosmetic Assistant"
    GOOGLE_CLIENT_ID: Optional[str] = None
    EMAIL_SMTP_HOST: Optional[str] = None
    EMAIL_SMTP_PORT: int = 587
    EMAIL_SMTP_USER: Optional[str] = None
    EMAIL_SMTP_PASSWORD: Optional[str] = None
    EMAIL_SMTP_FROM: Optional[str] = None
    EMAIL_SMTP_USE_TLS: bool = True
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
