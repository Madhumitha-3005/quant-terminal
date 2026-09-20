import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.cache import market_cache
from app.data_providers.factory import get_data_provider
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("quant_terminal")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Pre-warm market data cache
    masked_key = f"{settings.API_KEY[:6]}...{settings.API_KEY[-4:]}" if len(settings.API_KEY) > 10 else "UNSET"
    logger.info(f"Starting Quantitative Financial Intelligence Engine.")
    logger.info(f"Active Provider: {settings.DEFAULT_DATA_PROVIDER} | Fallback Enabled: {settings.FALLBACK_TO_YFINANCE}")
    logger.info(f"Hackathon API Token loaded: {masked_key}")
    
    # Pre-warm cache for Gold, Bitcoin, NVIDIA
    provider = get_data_provider()
    for symbol in settings.ASSETS.keys():
        try:
            logger.info(f"Pre-warming cache for {symbol}...")
            provider.get_historical_ohlcv(symbol)
        except Exception as e:
            logger.warning(f"Could not pre-warm {symbol}: {e}")

    yield
    logger.info("Shutting down Quantitative Intelligence Engine.")

app = FastAPI(
    title="Quantitative Multi-Asset Intelligence & Backtesting Platform",
    description="Institutional-grade market data, indicator analytics, and backtesting engine.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    cache_stats = market_cache.get_cache_stats()
    return {
        "status": "online",
        "system": "Quantitative Multi-Asset Financial Intelligence Platform",
        "version": "1.0.0",
        "active_provider": settings.DEFAULT_DATA_PROVIDER,
        "api_key_configured": bool(settings.API_KEY),
        "cached_assets": cache_stats,
        "lookahead_bias_prevention": "Guaranteed (strictly shifted signals & causal execution)"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
