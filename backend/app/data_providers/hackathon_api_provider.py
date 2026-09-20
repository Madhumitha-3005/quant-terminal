import logging
from typing import Optional
import httpx
import pandas as pd

from app.core.config import settings
from app.data_providers.base import BaseDataProvider
from app.data_providers.yfinance_provider import YFinanceProvider

logger = logging.getLogger(__name__)

class HackathonAPIProvider(BaseDataProvider):
    """
    Pluggable client for the official Hackathon Market Data API.
    Pre-configured with authentication headers and API_KEY from backend/.env.
    Automatically delegates to YFinanceProvider as a rock-solid fallback until
    the specific hackathon endpoint URL and schema are finalized by organizers.
    """

    def __init__(self):
        self._name = "hackathon_api"
        self.api_key = settings.API_KEY
        self.base_url = settings.HACKATHON_API_BASE_URL
        self.fallback_provider = YFinanceProvider()

    @property
    def provider_name(self) -> str:
        return self._name

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-API-Key": self.api_key,
            "Accept": "application/json",
            "User-Agent": "QuantTerminal/1.0 (Hackathon Edition)"
        }

    def fetch_ohlcv(
        self,
        symbol: str,
        start: Optional[str] = None,
        end: Optional[str] = None,
        interval: str = "1d"
    ) -> pd.DataFrame:
        if not self.base_url:
            logger.info("Hackathon base URL not yet specified; seamlessly using YFinance fallback.")
            return self.fallback_provider.fetch_ohlcv(symbol, start, end, interval)

        try:
            url = f"{self.base_url.rstrip('/')}/v1/market/{symbol}/ohlcv"
            params = {"start": start, "end": end, "interval": interval}
            
            with httpx.Client(timeout=5.0) as client:
                response = client.get(url, headers=self._get_headers(), params=params)
                response.raise_for_status()
                data = response.json()
                
                # Transform standardized hackathon response if available
                df = pd.DataFrame(data.get("results", data))
                df["timestamp"] = pd.to_datetime(df["timestamp"])
                df.set_index("timestamp", inplace=True)
                return df[["open", "high", "low", "close", "volume"]].astype(float)
        except Exception as e:
            logger.warning(f"Hackathon API call failed ({str(e)}); executing fallback to YFinance.")
            return self.fallback_provider.fetch_ohlcv(symbol, start, end, interval)

    def get_historical_ohlcv(
        self,
        symbol: str,
        start: Optional[str] = None,
        end: Optional[str] = None,
        interval: str = "1d",
        force_refresh: bool = False
    ) -> pd.DataFrame:
        # Check fallback/cache layer
        return self.fallback_provider.get_historical_ohlcv(
            symbol=symbol,
            start=start,
            end=end,
            interval=interval,
            force_refresh=force_refresh
        )
