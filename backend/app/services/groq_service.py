"""Acceso único a GroqCloud para el chatbot documental."""

import json
import os
import re
from dataclasses import dataclass

from fastapi import HTTPException
from langchain_groq import ChatGroq

from app.core.config import (
    CHAT_MAX_ANSWER_TOKENS,
    CHAT_MAX_RETRIES,
    CHAT_TIMEOUT_SECONDS,
    GROQ_MODEL,
)


@dataclass
class ResultadoGroq:
    contenido: str
    tokens_entrada: int | None
    tokens_salida: int | None


def invocar(
    sistema: str, usuario: str, *, max_tokens: int | None = None, json_mode: bool = False,
) -> ResultadoGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY no está configurada")
    try:
        opciones_razonamiento = {"reasoning_effort": "low"} if GROQ_MODEL.startswith("openai/gpt-oss-") else {}
        modelo = ChatGroq(
            model=GROQ_MODEL,
            temperature=0,
            api_key=api_key,
            max_tokens=max_tokens or CHAT_MAX_ANSWER_TOKENS,
            timeout=CHAT_TIMEOUT_SECONDS,
            max_retries=CHAT_MAX_RETRIES,
            model_kwargs={"response_format": {"type": "json_object"}} if json_mode else {},
            **opciones_razonamiento,
        )
        respuesta = modelo.invoke([("system", sistema), ("human", usuario)])
    except Exception as exc:
        raise HTTPException(status_code=502, detail="No se pudo obtener una respuesta de Groq") from exc
    contenido = respuesta.content
    if not isinstance(contenido, str) or not contenido.strip():
        raise HTTPException(status_code=502, detail="Groq devolvió una respuesta vacía")
    uso = (respuesta.response_metadata or {}).get("token_usage") or {}
    return ResultadoGroq(
        contenido=contenido.strip(),
        tokens_entrada=uso.get("prompt_tokens"),
        tokens_salida=uso.get("completion_tokens"),
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
        raise HTTPException(status_code=502, detail="Groq devolvió una estructura inválida") from exc
    if not isinstance(datos, dict):
        raise HTTPException(status_code=502, detail="Groq devolvió una estructura inválida")
    return datos, resultado
