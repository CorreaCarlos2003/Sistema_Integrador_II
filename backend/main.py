from datetime import datetime, timedelta, timezone

import pyodbc
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
from pydantic import BaseModel, EmailStr

from conexion import obtener_conexion

SECRET_KEY = "cambiar-en-produccion"
ALGORITMO = "HS256"

app = FastAPI(title="API Chat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    correo: EmailStr
    contrasena: str


class UsuarioNuevo(BaseModel):
    nombre: str
    correo: EmailStr
    contrasena: str
    rol: str


class UsuarioEditar(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str


class UsuarioEstado(BaseModel):
    estado: int


def limpiar(valor):
    return valor.strip() if isinstance(valor, str) else valor


def como_usuario(fila):
    id_usuario, nombre, correo, rol, estado = fila
    return {
        "id": id_usuario,
        "nombre": limpiar(nombre),
        "correo": limpiar(correo),
        "rol": limpiar(rol),
        "estado": 1 if estado else 0,
    }


def ejecutar(sql, params=(), uno=False, commit=False):
    try:
        conexion = obtener_conexion()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo conectar a la BD: {error}") from error

    cursor = conexion.cursor()
    try:
        cursor.execute(sql, params)
        if commit:
            fila = cursor.fetchone() if cursor.description else None
            conexion.commit()
            return fila
        return cursor.fetchone() if uno else cursor.fetchall()
    except pyodbc.IntegrityError as error:
        conexion.rollback()
        raise HTTPException(
            status_code=409,
            detail="No se puede completar: el correo ya existe o el usuario tiene datos relacionados.",
        ) from error
    finally:
        cursor.close()
        conexion.close()


@app.post("/auth/login")
def login(datos: LoginRequest):
    try:
        conexion = obtener_conexion()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo conectar a la BD: {error}") from error

    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            SELECT id, nombre, correo, [contraseña_hash], rol, estado
            FROM dbo.usuarios
            WHERE correo = ?
            """,
            datos.correo,
        )
        usuario = cursor.fetchone()
    finally:
        cursor.close()
        conexion.close()

    if usuario is None:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    id_usuario, nombre, correo, hash_guardado, rol, estado = usuario

    if not estado:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    if (hash_guardado or "").strip() != datos.contrasena:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    token = jwt.encode(
        {
            "sub": str(id_usuario),
            "correo": correo,
            "rol": rol,
            "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        },
        SECRET_KEY,
        algorithm=ALGORITMO,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "id": id_usuario,
        "nombre": limpiar(nombre),
        "correo": limpiar(correo),
        "rol": limpiar(rol),
    }


@app.get("/usuarios")
def listar_usuarios():
    filas = ejecutar("SELECT id, nombre, correo, rol, estado FROM dbo.usuarios ORDER BY id")
    return [como_usuario(fila) for fila in filas]


@app.post("/usuarios")
def crear_usuario(datos: UsuarioNuevo):
    fila = ejecutar(
        """
        INSERT INTO dbo.usuarios (nombre, correo, [contraseña_hash], rol, estado)
        OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.correo, INSERTED.rol, INSERTED.estado
        VALUES (?, ?, ?, ?, 1)
        """,
        (datos.nombre.strip(), datos.correo, datos.contrasena, datos.rol.strip()),
        commit=True,
    )
    return como_usuario(fila)


@app.put("/usuarios/{id_usuario}")
def editar_usuario(id_usuario: int, datos: UsuarioEditar):
    fila = ejecutar(
        """
        UPDATE dbo.usuarios
        SET nombre = ?, correo = ?, rol = ?
        OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.correo, INSERTED.rol, INSERTED.estado
        WHERE id = ?
        """,
        (datos.nombre.strip(), datos.correo, datos.rol.strip(), id_usuario),
        commit=True,
    )
    if fila is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return como_usuario(fila)


@app.patch("/usuarios/{id_usuario}/estado")
def cambiar_estado(id_usuario: int, datos: UsuarioEstado):
    fila = ejecutar(
        """
        UPDATE dbo.usuarios
        SET estado = ?
        OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.correo, INSERTED.rol, INSERTED.estado
        WHERE id = ?
        """,
        (1 if datos.estado else 0, id_usuario),
        commit=True,
    )
    if fila is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return como_usuario(fila)


@app.delete("/usuarios/{id_usuario}")
def eliminar_usuario(id_usuario: int):
    fila = ejecutar(
        """
        DELETE FROM dbo.usuarios
        OUTPUT DELETED.id
        WHERE id = ?
        """,
        (id_usuario,),
        commit=True,
    )
    if fila is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"ok": True}
