import logging
import time
from typing import Optional
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.cache import market_cache
from app.data_providers.base import BaseDataProvider

logger = logging.getLogger(__name__)

class YFinanceProvider(BaseDataProvider):
    """
    Production-grade Yahoo Finance data provider with SQLite caching,
    ticker fallbacks (e.g., GC=F -> GLD), multi-index flattening,
    and automatic network retry logic.
    """

    def __init__(self):
        self._name = "yfinance"

    @property
    def provider_name(self) -> str:
        return self._name

    def _resolve_ticker(self, symbol: str) -> tuple[str, Optional[str]]:
        asset_info = settings.ASSETS.get(symbol.upper())
        if asset_info:
            return asset_info["ticker"], asset_info.get("fallback_ticker")
        return symbol, None

    def fetch_ohlcv(
        self,
        symbol: str,
        start: Optional[str] = None,
        end: Optional[str] = None,
        interval: str = "1d"
    ) -> pd.DataFrame:
        ticker, fallback_ticker = self._resolve_ticker(symbol)
        
        if not start:
            # Default to 4 years of history for rich backtesting & regimes
            start_dt = datetime.now(timezone.utc) - timedelta(days=4 * 365)
            start = start_dt.strftime("%Y-%m-%d")

        df = self._download_with_retry(ticker, start, end, interval)
        if (df is None or df.empty) and fallback_ticker and fallback_ticker != ticker:
            logger.warning(f"Primary ticker {ticker} yielded no data. Attempting fallback {fallback_ticker}")
            df = self._download_with_retry(fallback_ticker, start, end, interval)

        if df is None or df.empty:
            raise ValueError(f"Failed to fetch market data for {symbol} (ticker: {ticker})")

        return df

    def _download_with_retry(
        self,
        ticker: str,
        start: Optional[str],
        end: Optional[str],
        interval: str = "1d",
        max_retries: int = 3
    ) -> Optional[pd.DataFrame]:
        for attempt in range(1, max_retries + 1):
            try:
                # Use Ticker.history for reliable single-symbol download
                t = yf.Ticker(ticker)
                raw_df = t.history(start=start, end=end, interval=interval, auto_adjust=False)

                if raw_df is None or raw_df.empty:
                    # Alternative download method if history() is empty
                    raw_df = yf.download(ticker, start=start, end=end, interval=interval, progress=False)

                if raw_df is not None and not raw_df.empty:
                    return self._clean_dataframe(raw_df)
            except Exception as e:
                logger.warning(f"Attempt {attempt}/{max_retries} failed for ticker {ticker}: {str(e)}")
                if attempt < max_retries:
                    time.sleep(1.0 * attempt)
        return None

    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        clean = df.copy()

        # Handle multi-level columns if returned by newer yfinance
        if isinstance(clean.columns, pd.MultiIndex):
            clean.columns = [col[0] for col in clean.columns]

        # Standardize column casing
        clean.columns = [str(c).lower() for c in clean.columns]

        # Ensure index is DatetimeIndex and timezone-naive (standard UTC)
        if isinstance(clean.index, pd.DatetimeIndex):
            if clean.index.tz is not None:
                clean.index = clean.index.tz_convert(None)
        else:
            if "date" in clean.columns:
                clean["date"] = pd.to_datetime(clean["date"]).dt.tz_localize(None)
                clean.set_index("date", inplace=True)

        # Standard required OHLCV columns
        required = ["open", "high", "low", "close", "volume"]
        missing = [c for c in required if c not in clean.columns]
        if missing:
            # Check if 'adj close' exists
            if "adj close" in clean.columns and "close" not in clean.columns:
                clean["close"] = clean["adj close"]
            for col in missing:
                if col not in clean.columns and col == "volume":
                    clean["volume"] = 0.0

        clean = clean[required].astype(float)
        clean.dropna(subset=["close"], inplace=True)
        clean.sort_index(inplace=True)
        return clean

    def get_historical_ohlcv(
        self,
        symbol: str,
        start: Optional[str] = None,
        end: Optional[str] = None,
        interval: str = "1d",
        force_refresh: bool = False
    ) -> pd.DataFrame:
        norm_sym = symbol.upper()
        
        if not force_refresh:
            cached_df = market_cache.get_cached_ohlcv(norm_sym, start=start, end=end)
            if cached_df is not None and len(cached_df) > 30:
                # Check if cache is reasonably fresh (within last 3 days for daily data)
                latest_date = cached_df.index.max()
                days_stale = (datetime.now().date() - latest_date.date()).days
                if days_stale <= 3:
                    logger.info(f"Serving {norm_sym} ({len(cached_df)} bars) from SQLite cache.")
                    return cached_df

        # Fetch fresh data
        try:
            df = self.fetch_ohlcv(norm_sym, start=start, end=end, interval=interval)
            market_cache.save_ohlcv(norm_sym, df)
            logger.info(f"Fetched and cached {len(df)} bars for {norm_sym}.")
            return df
        except Exception as e:
            # Ultimate fallback to offline cache so presentation survives bad wifi!
            cached_df = market_cache.get_cached_ohlcv(norm_sym, start=start, end=end)
            if cached_df is not None and not cached_df.empty:
                logger.warning(f"Fetch failed ({str(e)}), safely serving cached offline data for {norm_sym}")
                return cached_df
            raise e
