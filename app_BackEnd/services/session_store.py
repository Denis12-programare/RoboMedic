import sqlite3
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime
import uuid
import json
from backend.models.schemas import ConsultationSession, UserProfile, AnalysisFindings, Recommendation


class SessionStore:
    def __init__(self, db_path: str = "sessions.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_db()
        self.sessions: Dict[str, ConsultationSession] = {}
        self._load_sessions_from_db()

    def _init_db(self):
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                owner_email TEXT,
                session_name TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                user_profile TEXT NOT NULL,
                history TEXT NOT NULL,
                analysis TEXT,
                validated_analysis TEXT,
                recommendations TEXT
            )
            """
        )

        # Add owner_email column if it doesn't exist in legacy tables
        cursor = self.conn.execute("PRAGMA table_info(sessions)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        if 'owner_email' not in existing_columns:
            self.conn.execute("ALTER TABLE sessions ADD COLUMN owner_email TEXT")
        self.conn.commit()

    def _row_to_session(self, row: sqlite3.Row) -> ConsultationSession:
        owner_email = row["owner_email"] if "owner_email" in row.keys() else None
        data = {
            "session_id": row["session_id"],
            "owner_email": owner_email,
            "session_name": row["session_name"],
            "created_at": datetime.fromisoformat(row["created_at"]),
            "updated_at": datetime.fromisoformat(row["updated_at"]),
            "user_profile": json.loads(row["user_profile"]),
            "history": json.loads(row["history"]),
            "analysis": json.loads(row["analysis"]) if row["analysis"] else None,
            "validated_analysis": json.loads(row["validated_analysis"]) if row["validated_analysis"] else None,
            "recommendations": json.loads(row["recommendations"]) if row["recommendations"] else None,
        }

        session = ConsultationSession(**data)
        return session

    def _save_session_to_db(self, session: ConsultationSession):
        analysis_json = json.dumps(session.analysis.model_dump()) if session.analysis else None
        recommendations_json = json.dumps(session.recommendations.model_dump()) if session.recommendations else None
        validated_analysis_json = json.dumps(session.validated_analysis) if session.validated_analysis else None

        self.conn.execute(
            "INSERT OR REPLACE INTO sessions (session_id, owner_email, session_name, created_at, updated_at, user_profile, history, analysis, validated_analysis, recommendations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                session.session_id,
                getattr(session, 'owner_email', None),
                getattr(session, 'session_name', None),
                session.created_at.isoformat(),
                session.updated_at.isoformat(),
                json.dumps(session.user_profile.model_dump()),
                json.dumps(session.history),
                analysis_json,
                validated_analysis_json,
                recommendations_json,
            )
        )
        self.conn.commit()

    def _load_sessions_from_db(self):
        cursor = self.conn.execute("SELECT * FROM sessions ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        for row in rows:
            try:
                session = self._row_to_session(row)
                self.sessions[session.session_id] = session
            except Exception:
                continue

    def create_session(self, owner_email: Optional[str] = None) -> ConsultationSession:
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        session = ConsultationSession(session_id=session_id, owner_email=owner_email, created_at=now, updated_at=now)
        self.sessions[session_id] = session
        self._save_session_to_db(session)
        return session

    def get_session(self, session_id: str) -> Optional[ConsultationSession]:
        return self.sessions.get(session_id)

    def update_session(self, session: ConsultationSession):
        session.updated_at = datetime.utcnow()
        self.sessions[session.session_id] = session
        self._save_session_to_db(session)

    def list_sessions(self, owner_email: Optional[str] = None) -> List[Dict[str, str]]:
        filtered_sessions = [s for s in self.sessions.values() if s.owner_email == owner_email] if owner_email else list(self.sessions.values())
        sessions = []
        for session in sorted(filtered_sessions, key=lambda x: x.created_at, reverse=True):
            last_message = session.history[-1]["content"] if session.history else ""
            session_name = getattr(session, 'session_name', None)
            if not session_name:
                session_name = (last_message[:50] + '...') if last_message else 'Skin Session'
            sessions.append({
                "session_id": session.session_id,
                "session_name": session_name,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.created_at.isoformat(),
                "last_message": last_message,
            })
        return sessions

    def rewind_session(self, session_id: str, index: int) -> Optional[ConsultationSession]:
        session = self.get_session(session_id)
        if not session:
            return None
        if index < 0 or index >= len(session.history):
            return None
        session.history = session.history[: index + 1]
        self.update_session(session)
        return session

    def rename_session(self, session_id: str, new_name: str) -> Optional[ConsultationSession]:
        session = self.get_session(session_id)
        if not session:
            return None
        session.session_name = new_name
        self.update_session(session)
        return session

    def delete_session(self, session_id: str) -> bool:
        existed = self.sessions.pop(session_id, None) is not None
        cursor = self.conn.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        self.conn.commit()
        return existed or cursor.rowcount > 0


session_store = SessionStore()
