"""
Motor de RAG (Retrieval-Augmented Generation) del proyecto.

Reimplementa, para uso desde la API, la lógica prototipada en el notebook
`RAG/Base_Chroma.ipynb`: carga de .docx, chunking y búsqueda semántica con
Chroma. Cada proyecto tiene su propia colección de Chroma, aislada de las
demás, persistida en disco bajo `RAG_STORAGE_DIR`.

Por ahora solo se implementa retrieval (no hay generación de respuesta con
un LLM): el chat devuelve los fragmentos más relevantes para la pregunta.
"""

import os

from docx import Document as WordDocument
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from app.core.config import (
    RAG_CHUNK_OVERLAP,
    RAG_CHUNK_SIZE,
    RAG_EMBEDDING_MODEL,
    RAG_STORAGE_DIR,
)

_embeddings = None


def _obtener_embeddings() -> HuggingFaceEmbeddings:
    """Carga el modelo de embeddings una sola vez (es costoso de inicializar)."""
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=RAG_EMBEDDING_MODEL)
    return _embeddings


def _directorio_proyecto(proyecto_id: int) -> str:
    ruta = os.path.join(RAG_STORAGE_DIR, f"proyecto_{proyecto_id}")
    os.makedirs(os.path.join(ruta, "documentos"), exist_ok=True)
    return ruta


def ruta_documentos(proyecto_id: int) -> str:
    return os.path.join(_directorio_proyecto(proyecto_id), "documentos")


def obtener_vectorstore(proyecto_id: int) -> Chroma:
    directorio = os.path.join(_directorio_proyecto(proyecto_id), "chroma_db")
    return Chroma(
        embedding_function=_obtener_embeddings(),
        persist_directory=directorio,
        collection_name=f"proyecto_{proyecto_id}",
    )


def _cargar_docx(ruta: str) -> Document:
    docx = WordDocument(ruta)

    textos = [p.text.strip() for p in docx.paragraphs if p.text.strip()]
    contenido = "\n".join(textos)

    return Document(
        page_content=contenido,
        metadata={
            "source": ruta,
            "nombre": os.path.basename(ruta),
            "tipo": "docx",
        },
    )


def indexar_documento(proyecto_id: int, ruta_archivo: str) -> int:
    """Parte un .docx en chunks, los embebe y los guarda en la colección del proyecto.

    Devuelve la cantidad de chunks indexados.
    """
    documento = _cargar_docx(ruta_archivo)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=RAG_CHUNK_SIZE,
        chunk_overlap=RAG_CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents([documento])

    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = i
        chunk.metadata["proyecto_id"] = proyecto_id

    if not chunks:
        return 0

    vectorstore = obtener_vectorstore(proyecto_id)
    vectorstore.add_documents(chunks)

    return len(chunks)


def eliminar_documento_indexado(proyecto_id: int, ruta_archivo: str) -> None:
    """Elimina de la colección del proyecto todos los chunks de ese archivo."""
    vectorstore = obtener_vectorstore(proyecto_id)
    vectorstore.delete(where={"source": ruta_archivo})


def buscar(proyecto_id: int, pregunta: str, k: int = 5) -> list[dict]:
    vectorstore = obtener_vectorstore(proyecto_id)
    resultados = vectorstore.similarity_search_with_score(pregunta, k=k)

    return [
        {
            "documento": doc.metadata.get("nombre", ""),
            "chunk_id": doc.metadata.get("chunk_id", -1),
            "contenido": doc.page_content,
            "score": float(score),
        }
        for doc, score in resultados
    ]
