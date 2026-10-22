"""Acceso a proveedores de IA para el chatbot documental.

Groq es el proveedor principal. Si falla (cuota agotada, límite de tasa,
clave no configurada, error del proveedor), se intenta automáticamente con
Gemini y luego con OpenRouter (modelos gratuitos ":free"), en ese orden,
usando las claves GROQ_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY leídas
del entorno.
"""

import json
import os
import re
from dataclasses import dataclass
from typing import Callable

from fastapi import HTTPException
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from app.core.config import (
    CHAT_MAX_ANSWER_TOKENS,
    CHAT_MAX_RETRIES,
    CHAT_TIMEOUT_SECONDS,
    GEMINI_MODEL,
    GROQ_MODEL,
    OPENROUTER_MODEL,
)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


@dataclass
class ResultadoGroq:
    contenido: str
    tokens_entrada: int | None
    tokens_salida: int | None
    proveedor: str = "groq"
    modelo: str = GROQ_MODEL


def _requerir_api_key(nombre_env: str) -> str:
    api_key = os.getenv(nombre_env)
    if not api_key:
        raise RuntimeError(f"{nombre_env} no está configurada")
    return api_key


def _modelo_groq(max_tokens: int, json_mode: bool):
    api_key = _requerir_api_key("GROQ_API_KEY")
    opciones_razonamiento = {"reasoning_effort": "low"} if GROQ_MODEL.startswith("openai/gpt-oss-") else {}
    return ChatGroq(
        model=GROQ_MODEL,
        temperature=0,
        api_key=api_key,
        max_tokens=max_tokens,
        timeout=CHAT_TIMEOUT_SECONDS,
        max_retries=CHAT_MAX_RETRIES,
        model_kwargs={"response_format": {"type": "json_object"}} if json_mode else {},
        **opciones_razonamiento,
    )


def _modelo_gemini(max_tokens: int, json_mode: bool):
    api_key = _requerir_api_key("GEMINI_API_KEY")
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        temperature=0,
        google_api_key=api_key,
        max_tokens=max_tokens,
        timeout=CHAT_TIMEOUT_SECONDS,
        max_retries=CHAT_MAX_RETRIES,
        response_mime_type="application/json" if json_mode else None,
    )


def _modelo_openrouter(max_tokens: int, json_mode: bool):
    api_key = _requerir_api_key("OPENROUTER_API_KEY")
    # "openrouter/free" elige al azar un modelo gratuito disponible, y varios de
    # esos modelos gastan tokens en razonamiento oculto antes de la respuesta
    # final. Se da un margen extra para que no se corten antes de responder.
    return ChatOpenAI(
        model=OPENROUTER_MODEL,
        temperature=0,
        api_key=api_key,
        base_url=OPENROUTER_BASE_URL,
        max_tokens=max_tokens + 500,
        timeout=CHAT_TIMEOUT_SECONDS,
        max_retries=CHAT_MAX_RETRIES,
        model_kwargs={"response_format": {"type": "json_object"}} if json_mode else {},
    )


# Orden de respaldo: si Groq falla (límite de tasa, cuota agotada, error del
# proveedor, clave no configurada), se intenta con el siguiente.
_PROVEEDORES: list[tuple[str, str, Callable[[int, bool], object]]] = [
    ("groq", GROQ_MODEL, _modelo_groq),
    ("gemini", GEMINI_MODEL, _modelo_gemini),
    ("openrouter", OPENROUTER_MODEL, _modelo_openrouter),
]


def invocar(
    sistema: str, usuario: str, *, max_tokens: int | None = None, json_mode: bool = False,
) -> ResultadoGroq:
    tokens = max_tokens or CHAT_MAX_ANSWER_TOKENS
    errores = []
    for nombre, modelo_id, construir in _PROVEEDORES:
        ultimo_error = None
        # Dos intentos por proveedor: algunos fallos son transitorios (sobrecarga
        # momentánea, o en OpenRouter un modelo gratuito al azar que agota los
        # tokens "pensando" sin llegar a responder).
        for _ in range(2):
            try:
                modelo = construir(tokens, json_mode)
                respuesta = modelo.invoke([("system", sistema), ("human", usuario)])
                # .text normaliza el contenido: algunos proveedores (p. ej. Gemini)
                # devuelven una lista de bloques en vez de un string plano.
                contenido = respuesta.text
                if not isinstance(contenido, str) or not contenido.strip():
                    raise ValueError("respuesta vacía")
                if nombre != "groq":
                    print(f"[chat IA] Groq no respondió; se usó el respaldo: {nombre} ({modelo_id})")
                uso = respuesta.usage_metadata or {}
                return ResultadoGroq(
                    contenido=contenido.strip(),
                    tokens_entrada=uso.get("input_tokens"),
                    tokens_salida=uso.get("output_tokens"),
                    proveedor=nombre,
                    modelo=modelo_id,
                )
            except Exception as exc:
                ultimo_error = exc
        errores.append(f"{nombre}: {ultimo_error}")
    raise HTTPException(
        status_code=502,
        detail="No se pudo obtener una respuesta de ningún proveedor de IA configurado "
        f"(Groq, Gemini, OpenRouter). Detalle: {'; '.join(errores)}",
    )


def invocar_json(sistema: str, usuario: str, *, max_tokens: int | None = None) -> tuple[dict, ResultadoGroq]:
    resultado = invocar(sistema, usuario, max_tokens=max_tokens, json_mode=True)
    texto = resultado.contenido
    # Tolerar envoltorios Markdown; el contenido interno debe seguir siendo JSON válido.
    bloque = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", texto, flags=re.I | re.S)
    if bloque:
        texto = bloque.group(1)
    try:
        datos = json.loads(texto)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"{resultado.proveedor} devolvió una estructura inválida") from exc
    if not isinstance(datos, dict):
        raise HTTPException(status_code=502, detail=f"{resultado.proveedor} devolvió una estructura inválida")
    return datos, resultado
