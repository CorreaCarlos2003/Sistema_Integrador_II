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
import shutil

from docx import Document as WordDocument
from docx.table import Table
from docx.text.paragraph import Paragraph
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


def extraer_bloques_docx(ruta: str) -> list[tuple[str, str]]:
    """Extrae párrafos y tablas en el orden en que aparecen en el DOCX."""
    docx = WordDocument(ruta)
    bloques = []
    for elemento in docx.element.body.iterchildren():
        if elemento.tag.endswith("}p"):
            parrafo = Paragraph(elemento, docx)
            texto = parrafo.text.strip()
            if texto:
                bloques.append((texto, parrafo.style.name))
        elif elemento.tag.endswith("}tbl"):
            tabla = Table(elemento, docx)
            for fila in tabla.rows:
                texto = " | ".join(celda.text.strip().replace("\n", " / ") for celda in fila.cells)
                if texto.strip(" |"):
                    bloques.append((texto, "Tabla"))
    return bloques


def _cargar_docx(ruta: str, nombre: str | None = None) -> Document:
    contenido = "\n".join(texto for texto, _ in extraer_bloques_docx(ruta))

    return Document(
        page_content=contenido,
        metadata={
            "source": ruta,
            "nombre": nombre or os.path.basename(ruta),
            "tipo": "docx",
        },
    )


def indexar_documento(proyecto_id: int, ruta_archivo: str, nombre: str | None = None) -> int:
    """Parte un .docx en chunks, los embebe y los guarda en la colección del proyecto.

    Devuelve la cantidad de chunks indexados.
    """
    documento = _cargar_docx(ruta_archivo, nombre)

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


def eliminar_proyecto_indexado(proyecto_id: int) -> None:
    """Borra del disco los documentos y la colección vectorial del proyecto."""
    ruta = os.path.join(RAG_STORAGE_DIR, f"proyecto_{proyecto_id}")
    if os.path.isdir(ruta):
        shutil.rmtree(ruta)


def buscar(
    proyecto_id: int, pregunta: str, k: int = 5, rutas_archivo: list[str] | None = None,
) -> list[dict]:
    vectorstore = obtener_vectorstore(proyecto_id)
    if rutas_archivo is not None:
        if not rutas_archivo:
            return []
        filtro = (
            {"source": rutas_archivo[0]}
            if len(rutas_archivo) == 1
            else {"source": {"$in": rutas_archivo}}
        )
        resultados = vectorstore.similarity_search_with_score(pregunta, k=k, filter=filtro)
    else:
        resultados = vectorstore.similarity_search_with_score(pregunta, k=k)

    return [
        {
            "documento": doc.metadata.get("nombre", ""),
            "chunk_id": doc.metadata.get("chunk_id", -1),
            "contenido": doc.page_content,
            "score": float(score),
            "ruta_archivo": doc.metadata.get("source", ""),
            "pagina": doc.metadata.get("pagina"),
            "seccion": doc.metadata.get("seccion"),
        }
        for doc, score in resultados
    ]
