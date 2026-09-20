import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any
import pandas as pd
from datetime import datetime, timezone

class SQLiteMarketCache:
    def __init__(self, db_path: Optional[Path] = None):
        if db_path is None:
            base_dir = Path(__file__).resolve().parent.parent.parent
            data_dir = base_dir / "data"
            data_dir.mkdir(parents=True, exist_ok=True)
            self.db_path = data_dir / "market_cache.db"
        else:
            self.db_path = Path(db_path)
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        return sqlite3.connect(str(self.db_path))

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ohlcv_cache (
                    symbol TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    open REAL NOT NULL,
                    high REAL NOT NULL,
                    low REAL NOT NULL,
                    close REAL NOT NULL,
                    volume REAL NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (symbol, timestamp)
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sym_time ON ohlcv_cache (symbol, timestamp)")
            conn.commit()

    def get_cached_ohlcv(
        self, 
        symbol: str, 
        start: Optional[str] = None, 
        end: Optional[str] = None
    ) -> Optional[pd.DataFrame]:
        query = "SELECT timestamp, open, high, low, close, volume FROM ohlcv_cache WHERE symbol = ?"
        params = [symbol]

        if start:
            query += " AND timestamp >= ?"
            params.append(start)
        if end:
            query += " AND timestamp <= ?"
            params.append(end)

        query += " ORDER BY timestamp ASC"

        with self._get_connection() as conn:
            df = pd.read_sql_query(query, conn, params=params)

        if df.empty:
            return None

        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df.set_index("timestamp", inplace=True)
        return df

    def save_ohlcv(self, symbol: str, df: pd.DataFrame) -> int:
        if df.empty:
            return 0

        clean_df = df.copy()
        if "timestamp" not in clean_df.columns:
            clean_df = clean_df.reset_index()
            # If the index name was Date or Datetime, rename to timestamp
            if "Date" in clean_df.columns:
                clean_df.rename(columns={"Date": "timestamp"}, inplace=True)
            elif "Datetime" in clean_df.columns:
                clean_df.rename(columns={"Datetime": "timestamp"}, inplace=True)
            elif "index" in clean_df.columns:
                clean_df.rename(columns={"index": "timestamp"}, inplace=True)

        # Standardize column casing
        clean_df.columns = [c.lower() for c in clean_df.columns]
        
        # Ensure timestamp is string YYYY-MM-DD
        clean_df["timestamp"] = pd.to_datetime(clean_df["timestamp"]).dt.strftime("%Y-%m-%d")
        clean_df["symbol"] = symbol
        clean_df["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Deduplicate on symbol & timestamp
        clean_df = clean_df.drop_duplicates(subset=["symbol", "timestamp"], keep="last")

        required_cols = ["symbol", "timestamp", "open", "high", "low", "close", "volume", "updated_at"]
        clean_df = clean_df[required_cols]

        records = clean_df.to_dict(orient="records")
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany("""
                INSERT INTO ohlcv_cache (symbol, timestamp, open, high, low, close, volume, updated_at)
                VALUES (:symbol, :timestamp, :open, :high, :low, :close, :volume, :updated_at)
                ON CONFLICT(symbol, timestamp) DO UPDATE SET
                    open=excluded.open,
                    high=excluded.high,
                    low=excluded.low,
                    close=excluded.close,
                    volume=excluded.volume,
                    updated_at=excluded.updated_at
            """, records)
            conn.commit()

        return len(records)

    def get_cache_stats(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    symbol, 
                    COUNT(*) as count, 
                    MIN(timestamp) as min_date, 
                    MAX(timestamp) as max_date,
                    MAX(updated_at) as last_updated
                FROM ohlcv_cache 
                GROUP BY symbol
            """)
            rows = cursor.fetchall()
            return {
                row[0]: {
                    "count": row[1],
                    "min_date": row[2],
                    "max_date": row[3],
                    "last_updated": row[4]
                }
                for row in rows
            }

market_cache = SQLiteMarketCache()
