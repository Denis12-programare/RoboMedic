from typing import Dict, Optional
from app.models.schemas import ConsultationSession
import uuid

class SessionStore:
    def __init__(self):
        self.sessions: Dict[str, ConsultationSession] = {}

    def create_session(self) -> ConsultationSession:
        session_id = str(uuid.uuid4())
        session = ConsultationSession(session_id=session_id)
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[ConsultationSession]:
        return self.sessions.get(session_id)

    def update_session(self, session: ConsultationSession):
        self.sessions[session.session_id] = session

session_store = SessionStore()
