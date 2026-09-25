import httpx

from app.core.config import settings


async def generate_gemini_text(prompt: str) -> str:
    api_key = (settings.gemini_api_key or '').strip()
    if not api_key:
        raise ValueError('GEMINI_API_KEY is not configured')

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024,
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    candidates = data.get('candidates') or []
    if not candidates:
        raise ValueError('Gemini returned no candidates')

    text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
    if not text:
        raise ValueError('Gemini returned an empty response')

    return text.strip()
