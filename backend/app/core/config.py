import os

from dotenv import load_dotenv


load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITMO = "HS256"

# RAG
RAG_STORAGE_DIR = "./rag_storage"
RAG_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
RAG_CHUNK_SIZE = 1000
RAG_CHUNK_OVERLAP = 200