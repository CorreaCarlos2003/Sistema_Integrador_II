import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import RAG_PRELOAD_EMBEDDINGS
from app.routers import auth, usuarios, proyecto, documento, permiso, historial, reportes, inicio, chat_v2
from app.services.rag_service import precalentar_embeddings


@asynccontextmanager
async def lifespan(_app: FastAPI):
    tarea_modelo = None
    if RAG_PRELOAD_EMBEDDINGS:
        tarea_modelo = asyncio.create_task(asyncio.to_thread(precalentar_embeddings))
    yield
    if tarea_modelo is not None and not tarea_modelo.done():
        await tarea_modelo


app = FastAPI(title="API Chat", lifespan=lifespan)


@app.get("/salud/rag", tags=["Salud"])
def salud_rag():
    if not RAG_PRELOAD_EMBEDDINGS:
        return {
            "estado": "listo",
            "mensaje": "La precarga esta desactivada; el modelo se cargara bajo demanda.",
            "segundos_carga": None,
        }
    from app.services.rag_service import obtener_estado_embeddings

    return obtener_estado_embeddings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(proyecto.router)
app.include_router(documento.router)
app.include_router(permiso.router)
app.include_router(historial.router)
app.include_router(reportes.router)
app.include_router(inicio.router)
app.include_router(chat_v2.router)
app.include_router(chat_v2.versiones_router)
