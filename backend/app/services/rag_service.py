"""
Motor de RAG (Retrieval-Augmented Generation) del proyecto.

Reimplementa, para uso desde la API, la lógica prototipada en el notebook
`RAG/Base_Chroma.ipynb`: carga de .docx, chunking y búsqueda semántica con
Chroma. Cada proyecto tiene su propia colección de Chroma, aislada de las
demás, persistida en disco bajo `RAG_STORAGE_DIR`.

Por ahora solo se implementa retrieval (no hay generación de respuesta con
un LLM): el chat devuelve los fragmentos más relevantes para la pregunta.
"""

import logging
import os
import shutil
import time
from threading import Lock

from app.core.config import (
    RAG_CHUNK_OVERLAP,
    RAG_CHUNK_SIZE,
    RAG_EMBEDDING_MODEL,
    RAG_LOCAL_FILES_ONLY,
    RAG_STORAGE_DIR,
)

# Estas variables deben establecerse antes de importar las librerias de
# Hugging Face para impedir sus comprobaciones HTTP en modo local.
if RAG_LOCAL_FILES_ONLY:
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

from docx import Document as WordDocument
from docx.table import Table
from docx.text.paragraph import Paragraph
from openpyxl import load_workbook
from pptx import Presentation
from pypdf import PdfReader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

_embeddings = None
_embeddings_lock = Lock()
_estado_lock = Lock()
_estado_embeddings = {
    "estado": "pendiente",
    "mensaje": "El modelo documental aun no ha iniciado.",
    "segundos_carga": None,
}
logger = logging.getLogger(__name__)


def _actualizar_estado(estado: str, mensaje: str, segundos_carga: float | None = None) -> None:
    with _estado_lock:
        _estado_embeddings.update({
            "estado": estado,
            "mensaje": mensaje,
            "segundos_carga": segundos_carga,
        })


def obtener_estado_embeddings() -> dict:
    """Devuelve una copia segura del estado de inicializacion del modelo."""
    with _estado_lock:
        return dict(_estado_embeddings)


def _obtener_embeddings() -> HuggingFaceEmbeddings:
    """Carga el modelo de embeddings una sola vez (es costoso de inicializar)."""
    global _embeddings
    if _embeddings is not None:
        return _embeddings

    with _embeddings_lock:
        if _embeddings is not None:
            return _embeddings
        opciones_modelo = {"local_files_only": True} if RAG_LOCAL_FILES_ONLY else {}
        try:
            _embeddings = HuggingFaceEmbeddings(
                model_name=RAG_EMBEDDING_MODEL,
                model_kwargs=opciones_modelo,
            )
        except Exception as exc:
            if RAG_LOCAL_FILES_ONLY:
                raise RuntimeError(
                    "No se pudo cargar el modelo de embeddings desde la cache local. "
                    "Descargalo una vez con RAG_LOCAL_FILES_ONLY=false y conexion a "
                    "Internet, o revisa la cache de Hugging Face."
                ) from exc
            raise
    return _embeddings


def precalentar_embeddings() -> None:
    """Carga el modelo al arrancar la API y registra el tiempo empleado."""
    inicio = time.perf_counter()
    _actualizar_estado("cargando", "Preparando el modelo documental.")
    logger.info(
        "Precargando modelo de embeddings '%s' (solo local: %s)...",
        RAG_EMBEDDING_MODEL,
        RAG_LOCAL_FILES_ONLY,
    )
    try:
        embeddings = _obtener_embeddings()
        embeddings.embed_query("inicializacion")
        segundos = round(time.perf_counter() - inicio, 2)
        _actualizar_estado("listo", "El modelo documental esta listo.", segundos)
        logger.info("Modelo de embeddings listo en %.2f segundos.", segundos)
    except Exception as exc:
        _actualizar_estado(
            "error",
            "No se pudo iniciar el modelo documental. Revisa la cache local y la consola del backend.",
        )
        logger.exception("No se pudo precalentar el modelo de embeddings: %s", exc)


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
                nombre_estilo = parrafo.style.name if parrafo.style is not None else "Normal"
                bloques.append((texto, nombre_estilo))
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


def _cargar_pdf(ruta: str, nombre: str | None = None) -> Document:
    lector = PdfReader(ruta)
    paginas = [(pagina.extract_text() or "").strip() for pagina in lector.pages]
    contenido = "\n".join(texto for texto in paginas if texto)

    return Document(
        page_content=contenido,
        metadata={
            "source": ruta,
            "nombre": nombre or os.path.basename(ruta),
            "tipo": "pdf",
        },
    )


def _cargar_excel(ruta: str, nombre: str | None = None) -> Document:
    libro = load_workbook(ruta, data_only=True, read_only=True)
    bloques = []
    for hoja in libro.worksheets:
        for fila in hoja.iter_rows(values_only=True):
            celdas = [str(celda).strip() for celda in fila if celda is not None and str(celda).strip()]
            if celdas:
                bloques.append(" | ".join(celdas))
    contenido = "\n".join(bloques)

    return Document(
        page_content=contenido,
        metadata={
            "source": ruta,
            "nombre": nombre or os.path.basename(ruta),
            "tipo": "xlsx",
        },
    )


def _cargar_pptx(ruta: str, nombre: str | None = None) -> Document:
    presentacion = Presentation(ruta)
    bloques = []
    for indice, diapositiva in enumerate(presentacion.slides, start=1):
        textos = []
        for forma in diapositiva.shapes:
            if forma.has_text_frame:
                texto = forma.text_frame.text.strip()
                if texto:
                    textos.append(texto)
            if forma.has_table:
                for fila in forma.table.rows:
                    texto_fila = " | ".join(celda.text.strip() for celda in fila.cells)
                    if texto_fila.strip(" |"):
                        textos.append(texto_fila)
        if textos:
            bloques.append(f"[Diapositiva {indice}]\n" + "\n".join(textos))
    contenido = "\n\n".join(bloques)

    return Document(
        page_content=contenido,
        metadata={
            "source": ruta,
            "nombre": nombre or os.path.basename(ruta),
            "tipo": "pptx",
        },
    )


def _cargar_texto_plano(ruta: str, nombre: str | None = None, tipo: str = "txt") -> Document:
    with open(ruta, "r", encoding="utf-8", errors="replace") as archivo:
        contenido = archivo.read()

    return Document(
        page_content=contenido,
        metadata={
            "source": ruta,
            "nombre": nombre or os.path.basename(ruta),
            "tipo": tipo,
        },
    )


_CARGADORES_POR_EXTENSION = {
    ".docx": _cargar_docx,
    ".pdf": _cargar_pdf,
    ".xlsx": _cargar_excel,
    ".pptx": _cargar_pptx,
    ".txt": lambda ruta, nombre=None: _cargar_texto_plano(ruta, nombre, "txt"),
    ".md": lambda ruta, nombre=None: _cargar_texto_plano(ruta, nombre, "md"),
}


def _cargar_documento(ruta: str, nombre: str | None = None) -> Document:
    extension = os.path.splitext(nombre or ruta)[1].lower()
    cargador = _CARGADORES_POR_EXTENSION.get(extension)
    if cargador is None:
        raise ValueError(f"Formato de archivo no soportado: {extension}")
    return cargador(ruta, nombre)


def indexar_documento(
    proyecto_id: int,
    ruta_archivo: str,
    nombre: str | None = None,
    *,
    documento_id: int | None = None,
    version_id: int | None = None,
    numero_version: str | None = None,
) -> int:
    """Parte un documento en chunks, los embebe y los guarda en la colección del proyecto.

    Soporta .docx, .pdf, .xlsx, .pptx, .txt y .md.
    Devuelve la cantidad de chunks indexados.
    """
    documento = _cargar_documento(ruta_archivo, nombre)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=RAG_CHUNK_SIZE,
        chunk_overlap=RAG_CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents([documento])

    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = i
        chunk.metadata["proyecto_id"] = proyecto_id
        if documento_id is not None:
            chunk.metadata["documento_id"] = documento_id
        if version_id is not None:
            chunk.metadata["version_id"] = version_id
        if numero_version is not None:
            chunk.metadata["numero_version"] = numero_version

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
            "documento_id": doc.metadata.get("documento_id"),
            "version_id": doc.metadata.get("version_id"),
            "numero_version": doc.metadata.get("numero_version"),
            "pagina": doc.metadata.get("pagina"),
            "seccion": doc.metadata.get("seccion"),
        }
        for doc, score in resultados
    ]
