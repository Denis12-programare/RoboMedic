from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
from datetime import datetime
from backend.models.schemas import (
    ConsultationSession, ChatRequest, ChatResponse, 
    AnalysisFindings, ValidationRequest, Recommendation,
    SessionSummary, RewindRequest, SessionHistoryResponse,
    RenameSessionRequest, ProfileUpdateRequest,
    RegistrationRequest, VerificationRequest, LoginRequest,
    GoogleOAuthRequest
)
from backend.services.session_store import session_store
from backend.services.user_store import user_store
from backend.services.groq_service import groq_service
from backend.services.email_service import email_service
from backend.core.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import logging
import bcrypt
import secrets
import json
import base64

router = APIRouter()

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are a professional AI Cosmetic and Skincare Assistant. Your goal is to gather information from the user about their skin, lifestyle, and concerns.
Be empathetic, professional, and ask structured follow-up questions one or two at a time.
Collect:
1. Skin type (Oily, Dry, Combination, Sensitive, Normal)
2. Age range
3. Lifestyle (diet, sleep, stress)
4. Current routine
5. Primary problem areas

Once you have enough information, encourage the user to upload an image of their skin for a more detailed analysis.
"""

@router.post("/start-consultation", response_model=ConsultationSession)
async def start_consultation(user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    user = user_store.get_user_by_email(user_email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return session_store.create_session(owner_email=user_email.lower())

@router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions(user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session_items = session_store.list_sessions(owner_email=user_email.lower())
    return [SessionSummary(
        session_id=item["session_id"],
        session_name=item.get("session_name"),
        created_at=datetime.fromisoformat(item["created_at"]),
        updated_at=datetime.fromisoformat(item["updated_at"]),
        last_message=item.get("last_message")
    ) for item in session_items]

@router.get("/sessions/{session_id}", response_model=ConsultationSession)
async def get_session(session_id: str, user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(session_id)
    if not session or session.owner_email != user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/sessions/{session_id}/history", response_model=SessionHistoryResponse)
async def get_session_history(session_id: str, user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(session_id)
    if not session or session.owner_email != user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionHistoryResponse(session_id=session_id, history=session.history)

@router.post("/sessions/{session_id}/rewind", response_model=SessionHistoryResponse)
async def rewind_session(session_id: str, request: RewindRequest, user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(session_id)
    if not session or session.owner_email != user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    if request.index < 0 or request.index >= len(session.history):
        raise HTTPException(status_code=404, detail="Session not found or invalid rewind index")
    session = session_store.rewind_session(session_id, request.index)
    return SessionHistoryResponse(session_id=session_id, history=session.history)

def generate_session_name(message: str) -> str:
    keywords = {
        "acne": "Acne",
        "acne treatment": "Acne",
        "dry skin": "Dry Skin",
        "hydration": "Hydration",
        "aging": "Anti-aging",
        "wrinkle": "Anti-aging",
        "dark spots": "Dark Spots",
        "hyperpigmentation": "Hyperpigmentation",
        "sensitive": "Sensitive",
        "oil": "Oily Skin",
        "pores": "Pore Care",
        "rosacea": "Rosacea",
        "sunburn": "Sun Care",
        "spf": "Sun Protection",
        "texture": "Texture",
        "pigmentation": "Pigmentation",
        "rashes": "Skin Rash",
        "redness": "Redness"
    }
    lower = message.lower()
    for term, name in keywords.items():
        if term in lower:
            return name
    words = [w for w in message.strip().split() if w.isalpha()]
    if len(words) >= 2:
        return f"{words[0].capitalize()} {words[1].capitalize()}"
    if len(words) == 1:
        return words[0].capitalize()
    return "Skin Session"

def prepare_password_for_hash(password: str, max_bytes: int = 72, encoding: str = "utf-8") -> bytes:
    encoded = password.encode(encoding, errors="ignore")
    if len(encoded) <= max_bytes:
        return encoded
    truncated = encoded[:max_bytes]
    while truncated and (truncated[-1] & 0xC0) == 0x80:
        truncated = truncated[:-1]
    return truncated


def is_gmail_email(value: str) -> bool:
    return value.strip().lower().endswith("@gmail.com")


@router.post("/users/register")
async def register_user(request: RegistrationRequest):
    email = request.email.lower()
    display_name = request.name.strip() or email.split("@")[0]
    logger.info("Register attempt for %s (provider=%s)", email, request.provider or "local")
    existing = user_store.get_user_by_email(email)
    if existing:
        if request.provider == 'google':
            # Existing Google user login behavior
            return {
                "status": "ok",
                "email": existing["email"],
                "display_name": existing["display_name"]
            }
        user_store.delete_user(email)
        raise HTTPException(status_code=409, detail="A user with that email already exists")

    if not is_gmail_email(email):
        raise HTTPException(status_code=400, detail="We only support Gmail addresses")

    if request.provider == "local":
        if not request.password:
            raise HTTPException(status_code=400, detail="Password is required for local registrations")
        truncated_password = prepare_password_for_hash(request.password)
        try:
            password_hash = bcrypt.hashpw(truncated_password, bcrypt.gensalt()).decode("utf-8")
        except (ValueError, TypeError) as exc:
            logger.error("Password hashing failed for %s: %s", email, exc)
            raise HTTPException(status_code=400, detail="Password contains unsupported characters or is too long") from exc
        if not email_service.is_configured:
            logger.error("Email delivery is not configured for local registration")
            raise HTTPException(
                status_code=503,
                detail="Email verification is not configured on the server right now. Please update the SMTP settings and try again."
            )

        verification_code = f"{secrets.randbelow(10**6):06d}"
        verification_hash = user_store.hash_code(verification_code)

        user_store.create_user(
            email=email,
            display_name=display_name,
            provider="local",
            password_hash=password_hash,
            email_verified=False,
            verification_hash=verification_hash
        )

        delivery_ok = email_service.send_verification_code(email, verification_code)
        if not delivery_ok:
            user_store.delete_user(email)
            raise HTTPException(
                status_code=503,
                detail="We couldn't send the verification code right now. Please check the SMTP settings and try again."
            )
        return {"status": "pending_verification", "email": email}

    user_store.create_user(
        email=email,
        display_name=display_name,
        provider="google",
        password_hash=None,
        email_verified=True
    )
    return {"status": "ok", "display_name": display_name, "email": email}


@router.post("/users/verify-email")
async def verify_email(request: VerificationRequest):
    email = request.email.lower()
    user = user_store.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["email_verified"]:
        return {"status": "already_verified", "display_name": user["display_name"], "email": email}
    if not user_store.verify_code(email, request.code):
        raise HTTPException(status_code=400, detail="Verification code invalid or expired")
    return {"status": "verified", "display_name": user["display_name"], "email": email}


@router.post("/users/login")
async def login_user(request: LoginRequest):
    email = request.email.lower()
    user = user_store.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["provider"] != "local":
        raise HTTPException(status_code=400, detail="Please sign in with your Google account")
    if not user["email_verified"]:
        raise HTTPException(status_code=403, detail="Email not verified yet")
    truncated_password = prepare_password_for_hash(request.password)
    if (
        not user["password_hash"]
        or not bcrypt.checkpw(truncated_password, user["password_hash"].encode("utf-8"))
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"status": "ok", "display_name": user["display_name"], "email": email}


@router.post("/users/oauth/google")
async def google_oauth(request: GoogleOAuthRequest):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google client ID not configured on server")
    try:
        idinfo = id_token.verify_oauth2_token(request.credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
    except Exception as exc:
        logger.error("Google OAuth token verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid Google OAuth token")

    if idinfo.get("email_verified") is not True:
        raise HTTPException(status_code=400, detail="Google email not verified")

    email = idinfo.get("email", "").lower()
    if not is_gmail_email(email):
        raise HTTPException(status_code=400, detail="Only Gmail accounts are supported")

    user = user_store.get_user_by_email(email)
    if user is None:
        display_name = idinfo.get("name", email.split("@")[0])
        user_store.create_user(
            email=email,
            display_name=display_name,
            provider="google",
            password_hash=None,
            email_verified=True
        )
    else:
        display_name = user["display_name"]
        if not user["email_verified"]:
            user_store.mark_email_verified(email)

    return {"status": "ok", "email": email, "display_name": display_name}


@router.get("/users/profile")
async def get_user_profile(email: str):
    user = user_store.get_user_by_email(email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_profile": {
            "display_name": user["display_name"],
            "profile_image": user["profile_image"],
            "email": user["email"],
            "provider": user["provider"],
            "email_verified": user["email_verified"]
        }
    }

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(request.session_id)
    if not session or session.owner_email != request.user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update history
    session.history.append({"role": "user", "content": request.message})
    # Auto name session by topic if not set
    if not getattr(session, "session_name", None):
        session.session_name = generate_session_name(request.message)
    
    # Get response from Groq
    ai_response = await groq_service.get_chat_response(session.history, SYSTEM_PROMPT, session.user_profile.model_dump())
    session.history.append({"role": "assistant", "content": ai_response})
    
    # Try to extract profile data incrementally
    profile_data = await groq_service.extract_profile_data(session.history)
    for key, value in profile_data.items():
        if value is not None:
            setattr(session.user_profile, key, value)
    
    session_store.update_session(session)
    
    profile_status = {
        "skin_type": bool(session.user_profile.skin_type),
        "age_range": bool(session.user_profile.age_range),
        "lifestyle": bool(session.user_profile.lifestyle),
        "routine": bool(session.user_profile.current_routine),
        "problem_areas": len(session.user_profile.problem_areas) > 0
    }
    
    # Calculate AI-based health metrics
    health_metrics = await groq_service.calculate_health_metrics(session.user_profile.model_dump())
    
    return ChatResponse(
        response=ai_response,
        session_id=session.session_id,
        profile_status=profile_status,
        health_metrics=health_metrics
    )

@router.post("/upload-image", response_model=AnalysisFindings)
async def upload_image(session_id: str, file: UploadFile = File(...)):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    image_data = await file.read()
    analysis_result = await groq_service.analyze_image(image_data)
    findings = AnalysisFindings(**analysis_result)
    image_data_url = f"data:{file.content_type or 'image/png'};base64,{base64.b64encode(image_data).decode('utf-8')}"
    detected_findings = [issue.condition for issue in findings.issues]
    findings_text = (
        f"I've detected the following: {', '.join(detected_findings)}. Do these look correct?"
        if detected_findings
        else "I couldn't detect any specific issues. Is there anything particular you'd like me to analyze?"
    )
    session.history.append({
        "role": "user",
        "content": file.filename or "Uploaded image",
        "message_type": "image_upload_prompt",
        "data": image_data_url,
    })
    session.history.append({
        "role": "assistant",
        "content": findings_text,
        "message_type": "analysis",
        "data": json.dumps([issue.model_dump() for issue in findings.issues]),
    })
    session.analysis = findings
    session_store.update_session(session)
    
    return findings

@router.post("/validate-detection")
async def validate_detection(request: ValidationRequest, user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(request.session_id)
    if not session or session.owner_email != user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.validated_analysis = request.confirmed_issues
    session_store.update_session(session)
    return {"status": "success", "validated_issues": session.validated_analysis}

@router.post("/sessions/{session_id}/rename")
async def rename_session(session_id: str, request: RenameSessionRequest, user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(session_id)
    if not session or session.owner_email != user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    if not request.session_name.strip():
        raise HTTPException(status_code=400, detail="Session name cannot be empty")
    session = session_store.rename_session(session_id, request.session_name.strip())
    return {"session_id": session_id, "session_name": session.session_name}

@router.put("/sessions/{session_id}/profile")
async def update_profile(session_id: str, request: ProfileUpdateRequest, user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(session_id)
    if not session or session.owner_email != user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    if request.display_name is not None:
        session.user_profile.display_name = request.display_name
    if request.profile_image is not None:
        session.user_profile.profile_image = request.profile_image
    session_store.update_session(session)
    if request.email:
        user_store.update_profile(request.email.lower(), request.display_name, request.profile_image)
    return {"status": "ok", "user_profile": session.user_profile.model_dump()}

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(session_id)
    if not session or session.owner_email != user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    deleted = session_store.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "session_id": session_id}

@router.get("/recommendations", response_model=Recommendation)
async def get_recommendations(session_id: str, user_email: str):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email is required")
    session = session_store.get_session(session_id)
    if not session or session.owner_email != user_email.lower():
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Prepare data for recommendation engine
    session_data = {
        "profile": session.user_profile.model_dump(),
        "analysis": session.validated_analysis or [i.condition for i in (session.analysis.issues if session.analysis else [])]
    }

    try:
        recommendation_json = await groq_service.generate_recommendations(session_data)
        recommendation = Recommendation(**recommendation_json)
    except Exception as e:
        detail = str(e)
        if "concurrency" in detail.lower() or "limit exceeded" in detail.lower():
            raise HTTPException(
                status_code=503,
                detail="Recommendation service is currently busy. Please wait a few seconds and try again."
            )
        # return a safe fallback rather than crashing
        recommendation = Recommendation(
            morning_routine=[
                "Cleanse with gentle face wash",
                "Apply lightweight moisturizer with SPF",
                "Use a hydrating serum"
            ],
            night_routine=[
                "Double cleanse",
                "Apply treatment serum",
                "Use a nourishing moisturizer"
            ],
            products=[
                {"name": "Gentle Cleanser", "type": "cleanser", "reason": "For daily gentle cleansing"},
                {"name": "Hydrating Moisturizer", "type": "moisturizer", "reason": "Helps restore skin barrier"}
            ],
            lifestyle_tips=["Maintain 7+ hours sleep", "Drink water regularly"],
            diet_tips=["Include fruits and vegetables", "Limit sugar and processed foods"]
        )

    session.recommendations = recommendation
    session_store.update_session(session)

    return recommendation
