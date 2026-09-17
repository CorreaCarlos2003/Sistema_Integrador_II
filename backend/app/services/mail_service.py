import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import SMTP_FROM_NAME, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER


def _enviar(destinatario: str, asunto: str, texto: str, html: str) -> None:
    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = asunto
    mensaje["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    mensaje["To"] = destinatario

    mensaje.attach(MIMEText(texto, "plain"))
    mensaje.attach(MIMEText(html, "html"))

    contexto = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
        servidor.starttls(context=contexto)
        servidor.login(SMTP_USER, SMTP_PASSWORD)
        servidor.sendmail(SMTP_USER, destinatario, mensaje.as_string())


def enviar_invitacion_usuario(nombre: str, correo: str, contrasena: str, rol: str) -> None:
    texto = (
        f"Hola {nombre},\n\n"
        "Se ha creado una cuenta para ti en DocAI.\n\n"
        f"Correo: {correo}\n"
        f"Contraseña: {contrasena}\n"
        f"Rol: {rol}\n\n"
        "Ingresa a la plataforma con estos datos."
    )

    html = f"""
    <div style="font-family: Arial, sans-serif; color: #2b2622; max-width: 480px;">
      <h2 style="margin-bottom: 4px;">Bienvenido a DocAI</h2>
      <p>Hola <strong>{nombre}</strong>, se ha creado una cuenta para ti.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Correo</td><td><strong>{correo}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Contraseña</td><td><strong>{contrasena}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Rol</td><td><strong>{rol}</strong></td></tr>
      </table>
      <p>Ingresa a la plataforma con estos datos para comenzar.</p>
    </div>
    """

    _enviar(correo, "Bienvenido a DocAI - Datos de acceso", texto, html)


def enviar_contrasena(nombre: str, correo: str, contrasena: str) -> None:
    texto = (
        f"Hola {nombre},\n\n"
        "Solicitaste recuperar tu contraseña en DocAI.\n\n"
        f"Tu contraseña es: {contrasena}\n\n"
        "Si tú no solicitaste esto, comunícate con un administrador del sistema."
    )

    html = f"""
    <div style="font-family: Arial, sans-serif; color: #2b2622; max-width: 480px;">
      <h2 style="margin-bottom: 4px;">Recuperación de contraseña</h2>
      <p>Hola <strong>{nombre}</strong>, solicitaste recuperar tu contraseña en DocAI.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Contraseña</td><td><strong>{contrasena}</strong></td></tr>
      </table>
      <p>Si tú no solicitaste esto, comunícate con un administrador del sistema.</p>
    </div>
    """

    _enviar(correo, "Recuperación de contraseña - DocAI", texto, html)


def enviar_invitacion_proyecto(nombre: str, correo: str, proyecto_nombre: str, rol_proyecto: str, cargo: str | None) -> None:
    rol_legible = "Responsable" if rol_proyecto == "RESPONSABLE" else "Miembro"

    texto = (
        f"Hola {nombre},\n\n"
        f"Se te ha invitado a unirte al proyecto \"{proyecto_nombre}\" en DocAI.\n\n"
        f"Rol en el proyecto: {rol_legible}\n"
        + (f"Cargo: {cargo}\n" if cargo else "")
        + "\nIngresa a la plataforma y acepta o cancela la solicitud para confirmar tu participación."
    )

    fila_cargo = (
        f'<tr><td style="padding: 4px 12px 4px 0; color: #666;">Cargo</td><td><strong>{cargo}</strong></td></tr>'
        if cargo
        else ""
    )

    html = f"""
    <div style="font-family: Arial, sans-serif; color: #2b2622; max-width: 480px;">
      <h2 style="margin-bottom: 4px;">Invitación a un proyecto</h2>
      <p>Hola <strong>{nombre}</strong>, se te ha invitado a unirte al proyecto <strong>{proyecto_nombre}</strong>.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Proyecto</td><td><strong>{proyecto_nombre}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Rol</td><td><strong>{rol_legible}</strong></td></tr>
        {fila_cargo}
      </table>
      <p>Ingresa a la plataforma y acepta o cancela la solicitud para confirmar tu participación.</p>
    </div>
    """

    _enviar(correo, f"Invitación al proyecto {proyecto_nombre}", texto, html)
