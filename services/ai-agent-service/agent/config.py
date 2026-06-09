import os
import multiprocessing
from dotenv import load_dotenv

load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_OPTIONS = {
    "num_ctx": int(os.getenv("OLLAMA_NUM_CTX", "2048")),
    "num_predict": int(os.getenv("OLLAMA_NUM_PREDICT", "600")),
    "num_thread": int(os.getenv("OLLAMA_NUM_THREAD", str(multiprocessing.cpu_count()))),
}

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

JWT_SECRET = os.getenv("JWT_SECRET", "secret")
JWT_ALGORITHM = "HS256"

IAM_SERVICE_URL = os.getenv("IAM_SERVICE_URL", "http://iam-service:3000")
ACADEMIC_SERVICE_URL = os.getenv("ACADEMIC_SERVICE_URL", "http://academic-service:3000")
SCHEDULING_SERVICE_URL = os.getenv("SCHEDULING_SERVICE_URL", "http://scheduling-service:3000")
BILLING_SERVICE_URL = os.getenv("BILLING_SERVICE_URL", "http://billing-service:3000")
REPORTING_SERVICE_URL = os.getenv("REPORTING_SERVICE_URL", "http://reporting-service:3000")

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "/app/data/chroma")
CONVERSATIONS_DIR = os.getenv("CONVERSATIONS_DIR", "/app/data/conversations")
