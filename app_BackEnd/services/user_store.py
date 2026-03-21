import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
import hashlib


class UserStore:
    def __init__(self, db_path: str = "sessions.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                password_hash TEXT,
                provider TEXT NOT NULL,
                email_verified INTEGER NOT NULL,
                verification_hash TEXT,
                profile_image TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        self.conn.commit()

    def _hash_code(self, code: str) -> str:
        return hashlib.sha256(code.encode()).hexdigest()

    def hash_code(self, code: str) -> str:
        return self._hash_code(code)

    def _row_to_user(self, row: sqlite3.Row) -> Dict:
        return {
            "email": row["email"],
            "display_name": row["display_name"],
            "password_hash": row["password_hash"],
            "provider": row["provider"],
            "email_verified": bool(row["email_verified"]),
            "verification_hash": row["verification_hash"],
            "profile_image": row["profile_image"],
            "created_at": datetime.fromisoformat(row["created_at"]),
            "updated_at": datetime.fromisoformat(row["updated_at"])
        }

    def create_user(
        self,
        email: str,
        display_name: str,
        provider: str,
        password_hash: Optional[str] = None,
        email_verified: bool = False,
        verification_hash: Optional[str] = None,
        profile_image: Optional[str] = None
    ):
        now = datetime.utcnow().isoformat()
        self.conn.execute(
            """
            INSERT INTO users (email, display_name, password_hash, provider, email_verified, verification_hash, profile_image, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                email,
                display_name,
                password_hash,
                provider,
                1 if email_verified else 0,
                verification_hash,
                profile_image,
                now,
                now
            )
        )
        self.conn.commit()

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        cursor = self.conn.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_user(row)

    def set_verification_hash(self, email: str, code: str):
        hashed = self._hash_code(code)
        now = datetime.utcnow().isoformat()
        self.conn.execute(
            "UPDATE users SET verification_hash = ?, updated_at = ? WHERE email = ?",
            (hashed, now, email)
        )
        self.conn.commit()
        return hashed

    def verify_code(self, email: str, code: str) -> bool:
        user = self.get_user_by_email(email)
        if not user or not user.get("verification_hash"):
            return False
        if user["verification_hash"] != self._hash_code(code):
            return False
        now = datetime.utcnow().isoformat()
        self.conn.execute(
            "UPDATE users SET email_verified = 1, verification_hash = NULL, updated_at = ? WHERE email = ?",
            (now, email)
        )
        self.conn.commit()
        return True

    def update_profile(self, email: str, display_name: Optional[str] = None, profile_image: Optional[str] = None):
        user = self.get_user_by_email(email)
        if not user:
            return False
        now = datetime.utcnow().isoformat()
        updates = []
        params = []
        if display_name:
            updates.append("display_name = ?")
            params.append(display_name)
        if profile_image:
            updates.append("profile_image = ?")
            params.append(profile_image)
        if not updates:
            return False
        updates_clause = ", ".join(updates) + ", updated_at = ?"
        params.append(now)
        params.append(email)
        self.conn.execute(
            f"UPDATE users SET {updates_clause} WHERE email = ?",
            tuple(params)
        )
        self.conn.commit()
        return True

    def mark_email_verified(self, email: str):
        now = datetime.utcnow().isoformat()
        self.conn.execute(
            "UPDATE users SET email_verified = 1, verification_hash = NULL, updated_at = ? WHERE email = ?",
            (now, email)
        )
        self.conn.commit()

    def delete_user(self, email: str):
        self.conn.execute("DELETE FROM users WHERE email = ?", (email,))
        self.conn.commit()


user_store = UserStore()
