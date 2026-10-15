from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, usuarios, proyecto, documento, permiso, historial, reportes, chat_v2

app = FastAPI(title="API Chat")

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
app.include_router(chat_v2.router)
app.include_router(chat_v2.versiones_router)
