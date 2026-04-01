from google import genai
import os

API_KEY = "AIzaSyBXNH_MISLQKRZT6YMGsPgInjymYbHkKKw"
client = genai.Client(api_key=API_KEY)

print("Listing available models:")
try:
    for model in client.models.list(config={'page_size': 50}):
        print(f"- {model.name} (DisplayName: {model.display_name})")
except Exception as e:
    print("Error listing models:", e)
