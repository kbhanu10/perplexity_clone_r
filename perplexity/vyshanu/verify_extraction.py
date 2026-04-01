import PyPDF2
import io

try:
    with open('test.pdf', 'rb') as f:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(f.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        print("EXTRACTED TEXT:", text)
except Exception as e:
    print("ERROR:", e)
