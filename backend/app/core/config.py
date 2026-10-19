import os

from dotenv import load_dotenv

load_dotenv()


def _env_bool(nombre: str, valor_predeterminado: bool) -> bool:
    valor = os.getenv(nombre)
    if valor is None:
        return valor_predeterminado
    return valor.strip().lower() in {"1", "true", "yes", "si", "on"}

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cambiar-en-produccion")
ALGORITMO = "HS256"
SESION_DURACION_HORAS = 8

# Minutos sin actividad tras los que un usuario deja de verse "Activo" en Gestión de Usuarios
PRESENCIA_ACTIVA_MINUTOS = 2

# RAG
RAG_STORAGE_DIR = "./rag_storage"
RAG_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
RAG_CHUNK_SIZE = 1000
RAG_CHUNK_OVERLAP = 200
# Evita comprobaciones de red de Hugging Face cuando el modelo ya esta en cache.
RAG_LOCAL_FILES_ONLY = _env_bool("RAG_LOCAL_FILES_ONLY", True)
# Carga el modelo durante el arranque para que la primera subida no pague ese costo.
RAG_PRELOAD_EMBEDDINGS = _env_bool("RAG_PRELOAD_EMBEDDINGS", True)

# Chat documental. Los valores pueden ajustarse según el plan de Groq.
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
CHAT_RETRIEVAL_K = int(os.getenv("CHAT_RETRIEVAL_K", "5"))
CHAT_MAX_DISTANCE = float(os.getenv("CHAT_MAX_DISTANCE", "1.3"))
CHAT_HISTORY_TURNS = int(os.getenv("CHAT_HISTORY_TURNS", "8"))
CHAT_MAX_QUESTION_CHARS = int(os.getenv("CHAT_MAX_QUESTION_CHARS", "2000"))
CHAT_MAX_ANSWER_TOKENS = int(os.getenv("CHAT_MAX_ANSWER_TOKENS", "500"))
CHAT_MAX_CONTEXT_CHARS = int(os.getenv("CHAT_MAX_CONTEXT_CHARS", "24000"))
CHAT_MAX_COMPARISON_CHARS = int(os.getenv("CHAT_MAX_COMPARISON_CHARS", "45000"))
CHAT_MAX_CHANGE_CHARS = int(os.getenv("CHAT_MAX_CHANGE_CHARS", "4000"))
CHAT_TIMEOUT_SECONDS = int(os.getenv("CHAT_TIMEOUT_SECONDS", "45"))
CHAT_MAX_RETRIES = int(os.getenv("CHAT_MAX_RETRIES", "1"))
CHAT_RATE_LIMIT_PER_MINUTE = int(os.getenv("CHAT_RATE_LIMIT_PER_MINUTE", "10"))

# Correo (invitaciones a usuarios nuevos)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "DocAI")
