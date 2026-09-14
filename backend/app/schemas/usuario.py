from pydantic import BaseModel, EmailStr


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