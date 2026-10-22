from fastapi import HTTPException, status

from app.core.config import RAG_PRELOAD_EMBEDDINGS
from app.services.rag_service import obtener_estado_embeddings


def requerir_rag_listo() -> None:
    """Impide operaciones RAG mientras el modelo se inicializa en segundo plano."""
    if not RAG_PRELOAD_EMBEDDINGS:
        return

    estado = obtener_estado_embeddings()
    if estado["estado"] == "listo":
        return

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=estado["mensaje"],
        headers={"Retry-After": "3"},
    )
