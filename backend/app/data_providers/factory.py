import logging
from app.core.config import settings
from app.data_providers.base import BaseDataProvider
from app.data_providers.yfinance_provider import YFinanceProvider
from app.data_providers.hackathon_api_provider import HackathonAPIProvider

logger = logging.getLogger(__name__)

class DataProviderFactory:
    _instances = {}

    @classmethod
    def get_provider(cls, name: str = None) -> BaseDataProvider:
        provider_name = (name or settings.DEFAULT_DATA_PROVIDER).lower()

        if provider_name not in cls._instances:
            if provider_name == "hackathon_api":
                cls._instances[provider_name] = HackathonAPIProvider()
            elif provider_name == "yfinance":
                cls._instances[provider_name] = YFinanceProvider()
            else:
                logger.warning(f"Unknown provider '{provider_name}'. Defaulting to YFinanceProvider.")
                cls._instances[provider_name] = YFinanceProvider()

        return cls._instances[provider_name]

# Helper singleton getter
def get_data_provider() -> BaseDataProvider:
    return DataProviderFactory.get_provider()
