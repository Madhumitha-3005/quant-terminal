from abc import ABC, abstractmethod
from typing import Optional
import pandas as pd

class BaseDataProvider(ABC):
    """
    Abstract interface for multi-asset market data providers.
    Enables swapping out YFinance for the Hackathon API or proprietary institutional feeds
    without affecting business logic, indicators, or backtest engines.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the data provider implementation."""
        pass

    @abstractmethod
    def fetch_ohlcv(
        self,
        symbol: str,
        start: Optional[str] = None,
        end: Optional[str] = None,
        interval: str = "1d"
    ) -> pd.DataFrame:
        """
        Fetch raw OHLCV from the underlying provider source.
        Returns a DataFrame with columns: open, high, low, close, volume and DatetimeIndex.
        """
        pass

    @abstractmethod
    def get_historical_ohlcv(
        self,
        symbol: str,
        start: Optional[str] = None,
        end: Optional[str] = None,
        interval: str = "1d",
        force_refresh: bool = False
    ) -> pd.DataFrame:
        """
        Get OHLCV data, checking cache first and falling back to provider fetch.
        """
        pass
