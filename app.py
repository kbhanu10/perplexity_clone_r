from flask import Flask, request, jsonify, send_from_directory
import PyPDF2
from google import genai
from werkzeug.utils import secure_filename
import io
import os

app = Flask(__name__, static_folder='.', template_folder='.', static_url_path='')

# Gemini API Configuration — Gemini 2.5 Flash
API_KEY = "AIzaSyD_K45VGOqXR-FSeYy-v_1QepH9TMgSk3Q"
client = genai.Client(api_key=API_KEY)
MODEL = "gemini-2.5-flash"

# Global context for PDF text
pdf_context = ""

@app.route("/")
def index():
    return send_from_directory('.', 'index.html')

@app.route("/upload", methods=["POST"])
def upload():
    global pdf_context
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith('.pdf'):
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            pdf_context = text
            print(f"PDF loaded: {len(text)} characters extracted")
            return jsonify({"status": "Success", "filename": secure_filename(file.filename)})
        except Exception as e:
            return jsonify({"error": f"Failed to parse PDF: {str(e)}"}), 500

    return jsonify({"error": "Invalid file type. Only PDF is supported."}), 400

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_message = data.get("message")
        history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Build conversation contents for Gemini
        # System instruction as first context
        system_prompt = "You are Vyshanu, a helpful, friendly, and knowledgeable AI assistant. Be concise but thorough. Use markdown formatting when helpful."

        if pdf_context:
            system_prompt += f"\n\nThe user has uploaded a PDF document. Use the following content to answer questions about it. If the information is not in the PDF, answer based on your knowledge but mention it wasn't found in the document.\n\n[PDF CONTENT]:\n{pdf_context[:15000]}"

        # Build full prompt with history context
        full_prompt = system_prompt + "\n\n"

        for msg in history:
            role_label = "User" if msg.get("role") == "user" else "Vyshanu"
            full_prompt += f"{role_label}: {msg.get('content', '')}\n\n"

        full_prompt += f"User: {user_message}\n\nVyshanu:"

        print(f"Sending to Gemini 2.5 Flash: '{user_message[:80]}'")

        response = client.models.generate_content(
            model=MODEL,
            contents=full_prompt
        )

        if not response or not hasattr(response, 'text') or not response.text:
            return jsonify({"error": "No response from Gemini. Please try again."}), 500

        ai_response = response.text
        print(f"Gemini Response: {ai_response[:100]}...")
        return jsonify({"response": ai_response})

    except Exception as e:
        import traceback
        print(f"Server Error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Vyshanu AI Server powered by Gemini 2.5 Flash...")
    print("Open http://localhost:8080 in your browser")
    app.run(debug=True, port=8080)
