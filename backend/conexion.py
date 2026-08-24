import os

import pyodbc
from dotenv import load_dotenv

load_dotenv()

DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
SERVER = os.getenv("DB_SERVER", r"localhost\SQLEXPRESS")
DATABASE = os.getenv("DB_NAME", "BD_CHAT")
TRUSTED = os.getenv("DB_TRUSTED", "yes").lower() in {"1", "true", "yes"}
USER = os.getenv("DB_USER", "")
PASSWORD = os.getenv("DB_PASSWORD", "")


def cadena_conexion() -> str:
    partes = [
        f"DRIVER={{{DRIVER}}}",
        f"SERVER={SERVER}",
        f"DATABASE={DATABASE}",
        "TrustServerCertificate=yes",
    ]

    if TRUSTED:
        partes.append("Trusted_Connection=yes")
    else:
        partes.append(f"UID={USER}")
        partes.append(f"PWD={PASSWORD}")

    return ";".join(partes) + ";"


def obtener_conexion() -> pyodbc.Connection:
    return pyodbc.connect(cadena_conexion())
