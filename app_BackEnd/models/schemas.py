from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

class UserProfile(BaseModel):
    skin_type: Optional[str] = None
    age_range: Optional[str] = None
    lifestyle: Optional[str] = None
    current_routine: Optional[str] = None
    problem_areas: Optional[List[str]] = []
    display_name: Optional[str] = None
    profile_image: Optional[str] = None

class ImageAnalysisResult(BaseModel):
    condition: str
    confidence: float
    description: Optional[str] = None

class AnalysisFindings(BaseModel):
    issues: List[ImageAnalysisResult]
    raw_response: Optional[str] = None

class Recommendation(BaseModel):
    morning_routine: List[str]
    night_routine: List[str]
    products: List[Dict[str, str]]
    lifestyle_tips: List[str]
    diet_tips: List[str]

class ConsultationSession(BaseModel):
    session_id: str
    owner_email: Optional[EmailStr] = None
    session_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_profile: UserProfile = Field(default_factory=UserProfile)
    history: List[Dict[str, Any]] = []
    analysis: Optional[AnalysisFindings] = None
    validated_analysis: Optional[List[str]] = None
    recommendations: Optional[Recommendation] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_email: EmailStr

class ChatResponse(BaseModel):
    response: str
    session_id: str
    profile_status: Dict[str, bool]
    health_metrics: Optional[Dict[str, int]] = None

class ValidationRequest(BaseModel):
    session_id: str
    confirmed_issues: List[str]

class SessionSummary(BaseModel):
    session_id: str
    session_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None

class RewindRequest(BaseModel):
    index: int

class SessionHistoryResponse(BaseModel):
    session_id: str
    history: List[Dict[str, Any]]


class RenameSessionRequest(BaseModel):
    session_name: str


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    profile_image: Optional[str] = None
    email: Optional[EmailStr] = None


class RegistrationRequest(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    provider: Literal["local", "google"] = "local"


class VerificationRequest(BaseModel):
    email: EmailStr
    code: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleOAuthRequest(BaseModel):
    credential: str
