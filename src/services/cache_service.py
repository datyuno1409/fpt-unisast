import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Optional


class CacheService:
    def __init__(self, db_path: str = "cache.db"):
        self.db_path = db_path
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS vulnerability_fixes (
                    request_hash TEXT PRIMARY KEY,
                    fixed_code TEXT
                )
            """)

    def _generate_hash(self, vulnerability_data: dict) -> str:
        data_str = json.dumps(vulnerability_data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()

    def get_cached_fix(self, vulnerability_data: dict) -> Optional[str]:
        request_hash = self._generate_hash(vulnerability_data)

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT fixed_code FROM vulnerability_fixes WHERE request_hash = ?",
                (request_hash,)
            )
            result = cursor.fetchone()
            return result[0] if result else None

    def cache_fix(self, vulnerability_data: dict, fixed_code: str) -> None:
        request_hash = self._generate_hash(vulnerability_data)

        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO vulnerability_fixes (request_hash, fixed_code) VALUES (?, ?)",
                (request_hash, fixed_code)
            )
