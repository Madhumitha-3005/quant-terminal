from pathlib import Path
from typing import Dict, Any, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    API_KEY: str = Field(default="", description="Hackathon-provided API authentication key")
    DEFAULT_DATA_PROVIDER: str = Field(default="yfinance", description="Primary data source")
    FALLBACK_TO_YFINANCE: bool = Field(default=True, description="Fallback if primary fails")
    HACKATHON_API_BASE_URL: str = Field(default="", description="Hackathon endpoint base URL")
    FEATHERLESS_API_KEY: str = Field(default="", description="Featherless AI API key")
    FEATHERLESS_API_BASE_URL: str = Field(default="https://api.featherless.ai/v1", description="Featherless OpenAI-compatible API base URL")
    FEATHERLESS_MODEL: str = Field(default="meta-llama/Meta-Llama-3.1-8B-Instruct", description="Featherless chat model")
    DATABASE_URL: str = Field(default="sqlite:///data/market_cache.db", description="Cache SQLite DB")
    CACHE_TTL_HOURS: int = Field(default=24, description="Cache retention before refresh")
    HOST: str = Field(default="127.0.0.1")
    PORT: int = Field(default=8000)
    ENVIRONMENT: str = Field(default="development")
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000,http://127.0.0.1:3000")

    ASSETS: Dict[str, Dict[str, Any]] = {
        "GOLD": {
            "symbol": "GOLD",
            "ticker": "GC=F",
            "fallback_ticker": "GLD",
            "name": "Gold Futures (COMEX)",
            "asset_class": "Commodity",
            "currency": "USD",
            "is_crypto": False
        },
        "BTC": {
            "symbol": "BTC",
            "ticker": "BTC-USD",
            "fallback_ticker": "BTC-USD",
            "name": "Bitcoin",
            "asset_class": "Crypto",
            "currency": "USD",
            "is_crypto": True
        },
        "NVDA": {
            "symbol": "NVDA",
            "ticker": "NVDA",
            "fallback_ticker": "NVDA",
            "name": "NVIDIA Corporation",
            "asset_class": "Equities",
            "currency": "USD",
            "is_crypto": False
        }
    }

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

settings = Settings()
