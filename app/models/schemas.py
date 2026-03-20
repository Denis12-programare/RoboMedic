from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserProfile(BaseModel):
    skin_type: Optional[str] = None
    age_range: Optional[str] = None
    lifestyle: Optional[str] = None
    current_routine: Optional[str] = None
    problem_areas: Optional[List[str]] = []

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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_profile: UserProfile = Field(default_factory=UserProfile)
    history: List[Dict[str, str]] = []
    analysis: Optional[AnalysisFindings] = None
    validated_analysis: Optional[List[str]] = None
    recommendations: Optional[Recommendation] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    profile_status: Dict[str, bool]

class ValidationRequest(BaseModel):
    session_id: str
    confirmed_issues: List[str]
