import pyodbc
from fastapi import HTTPException
from app.database.conexion import get_db


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
        conexion = get_db()
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