from app_BackEnd.core.config import settings
from typing import List, Dict, Any
import json
import anyio
import asyncio
from openai import OpenAI
import base64

class GroqService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.FEATHERLESS_API_KEY, base_url=settings.FEATHERLESS_BASE_URL)
        self.default_model = settings.FEATHERLESS_DEFAULT_MODEL
        self.fast_model = settings.FEATHERLESS_FAST_MODEL
        self.large_model = settings.FEATHERLESS_LARGE_MODEL
        self.image_model = settings.FEATHERLESS_IMAGE_MODEL
        self._semaphore = asyncio.Semaphore(settings.FEATHERLESS_MAX_CONCURRENT_REQUESTS)

    def choose_model(self, history: List[Dict[str, str]], profile: Dict[str, Any] = None) -> str:
        if profile is None:
            profile = {}
        num_messages = len(history)
        profile_strength = sum(1 for v in profile.values() if v)

        if num_messages <= 4 and profile_strength == 0:
            return self.fast_model
        if num_messages > 15 or profile_strength >= 2:
            return self.large_model
        return self.default_model

    def _extract_message_content(self, response: Any) -> str:
        if hasattr(response, 'choices') and response.choices:
            choice = response.choices[0]
            if hasattr(choice, 'message'):
                message = choice.message
                if isinstance(message, dict):
                    content = message.get('content', '')
                else:
                    content = getattr(message, 'content', '')

                if isinstance(content, list):
                    text_parts: List[str] = []
                    for part in content:
                        if isinstance(part, dict):
                            if isinstance(part.get('text'), str):
                                text_parts.append(part['text'])
                            elif part.get('type') == 'text' and isinstance(part.get('content'), str):
                                text_parts.append(part['content'])
                        elif isinstance(part, str):
                            text_parts.append(part)
                    return "\n".join(part for part in text_parts if part)
                if isinstance(content, str):
                    return content
                return ''
            if hasattr(choice, 'text'):
                return getattr(choice, 'text', '')
        if hasattr(response, 'output_text'):
            return response.output_text
        return ''

    def _clean_json_text(self, text: str) -> str:
        cleaned = text.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```", 1)[1].split("```", 1)[0].strip()
        return cleaned

    def _detect_image_mime_type(self, image_data: bytes) -> str:
        if image_data.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        if image_data.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        if image_data.startswith((b"GIF87a", b"GIF89a")):
            return "image/gif"
        if image_data.startswith(b"RIFF") and image_data[8:12] == b"WEBP":
            return "image/webp"
        return "application/octet-stream"

    async def get_chat_response(self, history: List[Dict[str, str]], system_prompt: str, profile: Dict[str, Any] = None) -> str:
        messages = [{"role": "system", "content": system_prompt}] + history
        model = self.choose_model(history, profile)

        def sync_call():
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
            )
            return self._extract_message_content(response)

        async with self._semaphore:
            return await anyio.to_thread.run_sync(sync_call)

    async def extract_profile_data(self, history: List[Dict[str, str]]) -> Dict[str, Any]:
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

        model = self.choose_model(history)

        def sync_call():
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.3,
            )
            output = self._extract_message_content(response)
            if "```" in output:
                output = output.split("```")[-2].strip()
            try:
                return json.loads(output)
            except Exception:
                return {
                    "skin_type": None,
                    "age_range": None,
                    "lifestyle": None,
                    "current_routine": None,
                    "problem_areas": []
                }

        async with self._semaphore:
            return await anyio.to_thread.run_sync(sync_call)

    async def analyze_image(self, image_data: bytes) -> Dict[str, Any]:
        mime_type = self._detect_image_mime_type(image_data)
        b64 = base64.b64encode(image_data).decode('utf-8')
        image_uri = f"data:{mime_type};base64,{b64}"
        prompt = """
        Analyze this facial skin image for cosmetic or dermatological issues.
        Specifically look for visible concerns such as acne, dryness, irritation, dark spots,
        wrinkles, pigmentation, redness, or texture irregularities.

        Return only valid JSON in this shape:
        {
          "issues": [
            {
              "condition": "Condition Name",
              "confidence": 0.95,
              "description": "Brief observation"
            }
          ],
          "raw_response": "Short natural-language summary"
        }
        """

        def sync_call():
            response = self.client.chat.completions.create(
                model=self.image_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a skincare analysis assistant. Return only valid JSON."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_uri}}
                        ]
                    }
                ],
                temperature=0.2,
            )
            output = self._extract_message_content(response)
            output = self._clean_json_text(output)
            try:
                parsed = json.loads(output)
            except Exception:
                parsed = {
                    "issues": [
                        {"condition": "Unable to parse image", "confidence": 0.0, "description": output}
                    ],
                    "raw_response": output
                }
            if not isinstance(parsed, dict):
                return {
                    "issues": [
                        {"condition": "Unexpected response format", "confidence": 0.0, "description": str(parsed)}
                    ],
                    "raw_response": str(parsed)
                }
            parsed.setdefault("issues", [])
            parsed.setdefault("raw_response", output)
            return parsed

        async with self._semaphore:
            return await anyio.to_thread.run_sync(sync_call)

    async def generate_recommendations(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
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

        history = session_data.get("history", [])
        profile = session_data.get("profile", {})
        model = self.choose_model(history, profile)

        def sync_call():
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.6,
            )
            output = self._extract_message_content(response)
            if not output:
                raise RuntimeError("Recommendation model returned empty output")
            if "```" in output:
                output = output.split("```")[-2].strip()

            try:
                return json.loads(output)
            except json.JSONDecodeError:
                # Attempt to recover JSON from text
                start = output.find('{')
                end = output.rfind('}')
                if start != -1 and end != -1 and end > start:
                    try:
                        recovered = output[start:end+1]
                        return json.loads(recovered)
                    except json.JSONDecodeError:
                        pass
                # If still invalid, raise explicit error for endpoint to handle
                raise RuntimeError("Unable to parse recommendation JSON from AI output")

        async with self._semaphore:
            return await anyio.to_thread.run_sync(sync_call)

    async def calculate_health_metrics(self, profile: Dict[str, Any]) -> Dict[str, int]:
        """
        Calculate health metrics (skin_score, hydration, porosity) based on user profile.
        Returns scores from 0-100 for each metric.
        """
        # Extract only essential profile information to keep prompt short
        skin_type = profile.get('skin_type', 'unknown')
        age_range = profile.get('age_range', 'unknown')
        lifestyle = profile.get('lifestyle', 'unknown')
        current_routine = profile.get('current_routine', 'unknown')
        problem_areas = profile.get('problem_areas', [])

        # Create concise summary
        profile_summary = f"Skin type: {skin_type}, Age: {age_range}, Lifestyle: {lifestyle}, Routine: {current_routine}"
        if problem_areas:
            profile_summary += f", Problem areas: {', '.join(problem_areas)}"

        prompt = f"""As a dermatologist, calculate skin health metrics (0-100) based on this profile:

{profile_summary}

Return ONLY JSON: {{"skin_score": <overall health>, "hydration": <moisture level>, "porosity": <pore size>}}"""

        messages = [
            {"role": "system", "content": "You are a professional dermatologist. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]

        model = self.choose_model([], profile)

        def sync_call():
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.4,
                max_tokens=100  # Limit response length
            )
            output = self._extract_message_content(response)
            if "```" in output:
                output = output.split("```")[-2].strip()
            try:
                parsed = json.loads(output)
                # Validate the response has the expected keys
                required_keys = ["skin_score", "hydration", "porosity"]
                if not all(key in parsed for key in required_keys):
                    raise ValueError("Missing required metric keys")
                # Ensure values are integers 0-100
                for key in required_keys:
                    if not isinstance(parsed[key], int) or not (0 <= parsed[key] <= 100):
                        raise ValueError(f"Invalid {key} value: {parsed[key]}")
                return parsed
            except Exception as e:
                # Fallback to reasonable defaults if AI fails
                print(f"Health metrics calculation failed: {e}, using defaults")
                return {
                    "skin_score": 65,
                    "hydration": 55,
                    "porosity": 45
                }

        async with self._semaphore:
            return await anyio.to_thread.run_sync(sync_call)


groq_service = GroqService()
