# QUANT_TERMINAL // Quantitative Multi-Asset Intelligence & Backtesting Platform

A production-grade, multi-asset quantitative analytics and strategy backtesting terminal designed for national-level hackathons. Built with a decoupled architecture, pluggable data-provider layer, offline SQLite caching, and zero mock data.

---

## Key Architectural Principles

1. **Zero Mocked Financial Data**: Every single metric (Sharpe ratio, annualized volatility, max drawdown, CAGR, rolling correlation) and chart bar is calculated mathematically from real historical OHLCV data.
2. **Pluggable Data-Provider Interface**: `BaseDataProvider` abstract base class decouples upstream financial sources from business logic. The platform dynamically swaps between Yahoo Finance (`YFinanceProvider`) and the Hackathon's API (`HackathonAPIProvider`) without altering any indicator or backtesting code.
3. **Resilient Offline SQLite Cache**: Market data is cached locally to `backend/data/market_cache.db`. Pre-warmed on server startup so the application runs with sub-millisecond response times even under poor Wi-Fi conditions.
4. **Zero Look-Ahead Bias**: Causal execution model ensures all indicators and signals only observe historical data available at time `t`, with backtest fills calculated on `t + 1`.

---

## Project Structure

```
quant-terminal/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST endpoints (market_data, indicators)
│   │   ├── core/               # App configuration & SQLite persistence
│   │   ├── data_providers/     # BaseDataProvider, YFinance & Hackathon providers
│   │   ├── indicators/         # Pure NumPy/Pandas quantitative functions
│   │   └── main.py             # FastAPI entrypoint & cache pre-warming
│   ├── tests/                  # Pytest unit & integration test suite
│   ├── .env                    # Environment variables (API_KEY stored here)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js 14 App Router (layout, providers, page)
│   │   ├── components/         # Bloomberg/TradingView styled charts & tickers
│   │   ├── lib/                # Typed API client with TanStack React Query
│   │   └── types/              # Full TypeScript definitions
│   └── package.json
└── README.md
```

---

## Setup & Running Locally

### 1. API Key Configuration
The hackathon API token has been provisioned in `backend/.env`:
```env
API_KEY=rc_5dd1b9afdf9f53648afd2214445df96bbbf86557c4943487d6f9704b2a1b96d3
DEFAULT_DATA_PROVIDER=yfinance
FALLBACK_TO_YFINANCE=true
DATABASE_URL=sqlite:///data/market_cache.db
```
To connect the Hackathon API once endpoint documentation is confirmed, simply set:
```env
HACKATHON_API_BASE_URL=https://api.hackathon-provider.com
DEFAULT_DATA_PROVIDER=hackathon_api
```

### 2. Backend Startup
From the `backend/` directory:
```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 3. Frontend Startup
From the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev -- -p 3000
```
- Web Terminal: `http://localhost:3000`

---

## Running Automated Tests
Run the backend test suite:
```bash
cd backend
python -m pytest -o pythonpath=. tests/ -v
```

---

## Core Assets Tracked
- **Gold**: Comex Gold Futures (`GC=F`) / SPDR Gold Shares (`GLD`)
- **Bitcoin**: Bitcoin USD (`BTC-USD`)
- **NVIDIA**: NVIDIA Corporation (`NVDA`)