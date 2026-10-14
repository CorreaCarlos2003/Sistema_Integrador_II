import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = "cambiar-en-produccion"
ALGORITMO = "HS256"
SESION_DURACION_HORAS = 8

# Minutos sin actividad tras los que un usuario deja de verse "Activo" en Gestión de Usuarios
PRESENCIA_ACTIVA_MINUTOS = 2

# RAG
RAG_STORAGE_DIR = "./rag_storage"
RAG_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
RAG_CHUNK_SIZE = 1000
RAG_CHUNK_OVERLAP = 200

# Correo (invitaciones a usuarios nuevos)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "DocAI")