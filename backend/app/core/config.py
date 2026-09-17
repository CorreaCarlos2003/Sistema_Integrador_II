SECRET_KEY = "cambiar-en-produccion"
ALGORITMO = "HS256"

# RAG
RAG_STORAGE_DIR = "./rag_storage"
RAG_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
RAG_CHUNK_SIZE = 1000
RAG_CHUNK_OVERLAP = 200