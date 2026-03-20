from groq import AsyncGroq
from app.core.config import settings
from typing import List, Dict, Any
import json

class GroqService:
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL

    async def get_chat_response(self, history: List[Dict[str, str]], system_prompt: str) -> str:
        messages = [{"role": "system", "content": system_prompt}] + history
        response = await self.client.chat.completions.create(
            messages=messages,
            model=self.model,
            temperature=0.7,
        )
        return response.choices[0].message.content

    async def extract_profile_data(self, history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Extracts structured profile data from conversation history using LLM.
        """
        prompt = """
        Analyze the conversation history and extract the following user profile information in JSON format:
        {
            "skin_type": "string or null",
            "age_range": "string or null",
            "lifestyle": "string or null",
            "current_routine": "string or null",
            "problem_areas": ["list of strings"]
        }
        Only return the JSON. If information is missing, use null.
        """
        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history])
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Conversation history:\n{history_text}"}
        ]
        
        response = await self.client.chat.completions.create(
            messages=messages,
            model=self.model,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    async def generate_recommendations(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates final recommendations based on profile and validated analysis.
        """
        prompt = f"""
        Based on the following user data and validated skin analysis, generate a comprehensive personalized skincare recommendation.
        Data: {json.dumps(session_data)}
        
        Return the result in JSON format matching this schema:
        {{
            "morning_routine": ["step 1", "step 2", ...],
            "night_routine": ["step 1", "step 2", ...],
            "products": [{{ "name": "...", "type": "...", "reason": "..." }}],
            "lifestyle_tips": ["...", "..."],
            "diet_tips": ["...", "..."]
        }}
        Only return the JSON.
        """
        messages = [
            {"role": "system", "content": "You are a professional cosmetic and skincare expert AI."},
            {"role": "user", "content": prompt}
        ]
        response = await self.client.chat.completions.create(
            messages=messages,
            model=self.model,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

groq_service = GroqService()
