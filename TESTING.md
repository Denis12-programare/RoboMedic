# Testing & Usage Guide

## Setup
1. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your `GROQ_API_KEY` and `GEMINI_API_KEY`.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Example API Requests

### 1. Start Consultation
```bash
curl -X POST "http://localhost:8000/api/v1/start-consultation"
```
**Response:** `{"session_id": "...", "created_at": "...", ...}`

### 2. Chat with AI
```bash
curl -X POST "http://localhost:8000/api/v1/chat" \
     -H "Content-Type: application/json" \
     -d '{"session_id": "YOUR_SESSION_ID", "message": "Hi, I have dry skin and I am 25 years old."}'
```

### 3. Upload Image for Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/upload-image?session_id=YOUR_SESSION_ID" \
     -F "file=@path/to/your/skin_image.jpg"
```

### 4. Validate Detection
```bash
curl -X POST "http://localhost:8000/api/v1/validate-detection" \
     -H "Content-Type: application/json" \
     -d '{"session_id": "YOUR_SESSION_ID", "confirmed_issues": ["Dryness", "Acne"]}'
```

### 5. Get Recommendations
```bash
curl -X GET "http://localhost:8000/api/v1/recommendations?session_id=YOUR_SESSION_ID"
```

## Interactive API Docs
Visit [http://localhost:8000/docs](http://localhost:8000/docs) for the Swagger UI.
