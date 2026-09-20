from fastapi import APIRouter
from app.api.v1.endpoints import analysis, market_data, research, system

api_router = APIRouter()
api_router.include_router(market_data.router, prefix="/market", tags=["Market Data & Indicators"])
api_router.include_router(research.router, prefix="/research", tags=["AI Research Assistant"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Portfolio, Scenarios & Backtests"])
api_router.include_router(system.router, prefix="/system", tags=["System Architecture & Auditing"])