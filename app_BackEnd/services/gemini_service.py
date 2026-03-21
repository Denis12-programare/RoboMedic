from google import genai
from app_BackEnd.core.config import settings
from typing import Dict, Any, List
import PIL.Image
import json
import io

class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL

    async def analyze_image(self, image_data: bytes) -> Dict[str, Any]:
        """
        Analyzes the uploaded image for skin conditions using the new google-genai SDK.
        """
        image = PIL.Image.open(io.BytesIO(image_data))
        
        prompt = """
        Analyze this image of a face/skin and detect cosmetic or dermatological issues.
        Specifically look for: Acne, Dark spots, Dryness, Irritation, Wrinkles, Pigmentation.
        
        Return the analysis in JSON format:
        {
            "issues": [
                {
                    "condition": "Condition Name",
                    "confidence": 0.95,
                    "description": "Brief observation"
                }
            ],
            "raw_response": "Full textual description of findings"
        }
        Only return the JSON.
        """
        
        # Note: The new SDK generate_content is synchronous by default in basic usage, 
        # but for a production FastAPI app we'd typically use a thread pool or await 
        # if the SDK supports it. Here we use the direct client call.
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[prompt, image]
        )
        
        content = response.text.strip()
        
        # Cleanup JSON formatting if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        return json.loads(content)

gemini_service = GeminiService()
