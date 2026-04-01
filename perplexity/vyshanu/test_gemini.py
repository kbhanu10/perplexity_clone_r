from google import genai
import os

API_KEY = "AIzaSyBXNH_MISLQKRZT6YMGsPgInjymYbHkKKw"
client = genai.Client(api_key=API_KEY)

try:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="hi"
    )
    print("AI RESPONSE:", response.text)
except Exception as e:
    print("AI ERROR:", e)
