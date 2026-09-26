"""
vault.py — Safely stores the connection between a token and the real value using encryption.
"""

import csv
import os
import sqlite3
import threading
from datetime import datetime, timezone

from cryptography.fernet import Fernet

DB_PATH = "vault.db"
KEY_PATH = "vault_key.key"
WATCHLIST_PATH = "watchlist.csv"


def _load_or_create_key() -> bytes:
    if os.path.exists(KEY_PATH):
        with open(KEY_PATH, "rb") as f:
            return f.read()

    key = Fernet.generate_key()

    with open(KEY_PATH, "wb") as f:
        f.write(key)

    try:
        os.chmod(KEY_PATH, 0o600)
    except OSError:
        pass

    return key


def _load_watchlist() -> set:
    if not os.path.exists(WATCHLIST_PATH):
        return set()

    names = set()

    with open(WATCHLIST_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            names.add(row["flagged_name"])

    return names


def _init_db(conn: sqlite3.Connection) -> None:
    """Create the vault table if this is the first run."""
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS vault (
            token TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            encrypted_value BLOB NOT NULL,
            on_watchlist INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
        """
    )

    conn.commit()


class Vault:

    def __init__(self):
        self._fernet = Fernet(_load_or_create_key())
        self._conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self._lock = threading.Lock()

        _init_db(self._conn)

        self._watchlist = _load_watchlist()
        self._value_to_token = {}
        self._counters = {}

        self._rebuild_cache_from_disk()

    def _rebuild_cache_from_disk(self) -> None:
        cursor = self._conn.execute(
            "SELECT token, entity_type, encrypted_value FROM vault"
        )

        for token, entity_type, encrypted_value in cursor.fetchall():
            real_value = self._fernet.decrypt(
                encrypted_value
            ).decode("utf-8")

            self._value_to_token[(entity_type, real_value)] = token

            existing_number = int(token.rsplit("_", 1)[1])

            self._counters[entity_type] = max(
                self._counters.get(entity_type, 0),
                existing_number
            )

    def get_token(self, entity_type: str, real_value: str) -> str:
        with self._lock:
            key = (entity_type, real_value)

            if key in self._value_to_token:
                return self._value_to_token[key]

            self._counters[entity_type] = (
                self._counters.get(entity_type, 0) + 1
            )

            token = f"{entity_type}_{self._counters[entity_type]:03d}"

            encrypted_value = self._fernet.encrypt(
                real_value.encode("utf-8")
            )

            on_watchlist = real_value in self._watchlist

            self._conn.execute(
                "INSERT INTO vault "
                "(token, entity_type, encrypted_value, on_watchlist, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    token,
                    entity_type,
                    encrypted_value,
                    int(on_watchlist),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )

            self._conn.commit()

            self._value_to_token[key] = token

            return token

    def get_real_value(self, token: str) -> str | None:
        """Return the original value for a token, or None if it does not exist."""
        cursor = self._conn.execute(
            "SELECT encrypted_value FROM vault WHERE token = ?",
            (token,)
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return self._fernet.decrypt(row[0]).decode("utf-8")

    def is_on_watchlist(self, token: str) -> bool:
        cursor = self._conn.execute(
            "SELECT on_watchlist FROM vault WHERE token = ?",
            (token,)
        )

        row = cursor.fetchone()

        return bool(row[0]) if row else False

    def export_watchlist_flags(self) -> dict[str, bool]:
        """Return token -> watchlist status for all stored tokens."""
        cursor = self._conn.execute(
            "SELECT token, on_watchlist FROM vault"
        )

        return {
            token: bool(on_watchlist)
            for token, on_watchlist in cursor.fetchall()
        }

    def close(self) -> None:
        self._conn.close()