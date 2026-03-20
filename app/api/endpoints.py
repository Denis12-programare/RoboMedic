from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.models.schemas import (
    ConsultationSession, ChatRequest, ChatResponse, 
    AnalysisFindings, ValidationRequest, Recommendation
)
from app.services.session_store import session_store
from app.services.groq_service import groq_service
from app.services.gemini_service import gemini_service
import json

router = APIRouter()

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
async def start_consultation():
    return session_store.create_session()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session = session_store.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update history
    session.history.append({"role": "user", "content": request.message})
    
    # Get response from Groq
    ai_response = await groq_service.get_chat_response(session.history, SYSTEM_PROMPT)
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
    
    return ChatResponse(
        response=ai_response,
        session_id=session.session_id,
        profile_status=profile_status
    )

@router.post("/upload-image", response_model=AnalysisFindings)
async def upload_image(session_id: str, file: UploadFile = File(...)):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    image_data = await file.read()
    analysis_result = await gemini_service.analyze_image(image_data)
    
    findings = AnalysisFindings(**analysis_result)
    session.analysis = findings
    session_store.update_session(session)
    
    return findings

@router.post("/validate-detection")
async def validate_detection(request: ValidationRequest):
    session = session_store.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.validated_analysis = request.confirmed_issues
    session_store.update_session(session)
    return {"status": "success", "validated_issues": session.validated_analysis}

@router.get("/recommendations", response_model=Recommendation)
async def get_recommendations(session_id: str):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Prepare data for recommendation engine
    session_data = {
        "profile": session.user_profile.model_dump(),
        "analysis": session.validated_analysis or [i.condition for i in (session.analysis.issues if session.analysis else [])]
    }
    
    recommendation_json = await groq_service.generate_recommendations(session_data)
    recommendation = Recommendation(**recommendation_json)
    
    session.recommendations = recommendation
    session_store.update_session(session)
    
    return recommendation
