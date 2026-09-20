export interface AssetOverview {
  symbol: string;
  name: string;
  ticker: string;
  asset_class: string;
  currency: string;
  is_crypto: boolean;
  latest_price: number;
  change_24h: number;
  change_24h_pct: number;
  volume_24h: number;
  last_date: string;
  data_provider: string;
  error?: string;
}

export interface QuantitativeMetrics {
  start_date: string;
  end_date: string;
  start_price: number;
  latest_price: number;
  total_return_pct: number;
  cagr_pct: number;
  annualized_volatility_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  calmar_ratio: number;
  data_points: number;
}

export interface PriceBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  returns: number;
  sma_20: number | null;
  sma_50: number | null;
  ema_20: number | null;
  ema_50: number | null;
  drawdown_pct: number;
  volatility_pct: number | null;
}

export interface AssetHistoryResponse {
  symbol: string;
  meta: {
    symbol: string;
    ticker: string;
    name: string;
    asset_class: string;
    currency: string;
    is_crypto: boolean;
  };
  timeframe: string;
  total_bars: number;
  data_provider: string;
  metrics: QuantitativeMetrics;
  bars: PriceBar[];
}

export interface CorrelationResponse {
  timeframe: string;
  rolling_window_days: number;
  assets: string[];
  correlation_matrix: Record<string, Record<string, number>>;
  rolling_correlation: Array<{
    timestamp: string;
    [key: string]: number | string | null;
  }>;
}

export interface SystemStatus {
  status: string;
  system: string;
  version: string;
  active_provider: string;
  api_key_configured: boolean;
  cached_assets: Record<string, {
    count: number;
    min_date: string;
    max_date: string;
    last_updated: string;
  }>;
  lookahead_bias_prevention: string;
}

export interface ResearchResponse {
  answer: string;
  model: string;
}