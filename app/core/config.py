from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    GROQ_API_KEY: str
    GEMINI_API_KEY: str
    GROQ_MODEL: str = "llama-3-70b-8192"
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    PROJECT_NAME: str = "RoboMedic AI Cosmetic Assistant"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
