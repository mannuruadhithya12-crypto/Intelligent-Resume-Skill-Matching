import sys
print("Python executable:", sys.executable)

print("Attempting to import flask...")
try:
    import flask
    print("Flask imported successfully.")
except ImportError as e:
    print(f"Failed to import flask: {e}")

print("Attempting to import pdfplumber...")
try:
    import pdfplumber
    print("pdfplumber imported successfully.")
except ImportError as e:
    print(f"Failed to import pdfplumber: {e}")

print("Attempting to import docx...")
try:
    import docx
    print("docx imported successfully.")
except ImportError as e:
    print(f"Failed to import docx: {e}")

print("Attempting to import nltk...")
try:
    import nltk
    print("nltk imported successfully.")
    print("Downloading stopwords...")
    nltk.download('stopwords')
except ImportError as e:
    print(f"Failed to import nltk: {e}")

print("Attempting to import sentence_transformers...")
try:
    from sentence_transformers import SentenceTransformer
    print("sentence_transformers imported successfully.")
    print("Loading model (this may take a while)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Model loaded successfully.")
except ImportError as e:
    print(f"Failed to import sentence_transformers: {e}")
except Exception as e:
    print(f"Error loading model: {e}")

print("Verifying src imports...")
try:
    sys.path.append('.') # Ensure current dir is in path
    from src.main import run_pipeline
    print("src.main imported successfully.")
except ImportError as e:
    print(f"Failed to import src.main: {e}")
except Exception as e:
    print(f"Error importing src.main: {e}")

print("Diagnostics complete.")
