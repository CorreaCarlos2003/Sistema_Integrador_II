import smtplib
from email.message import EmailMessage
from app.core.config import MAIL_HOST, MAIL_PASSWORD, MAIL_PORT, MAIL_USER


def enviar_contrasena(destino: str, contrasena: str) -> None:
    mensaje = EmailMessage()
    mensaje["From"] = MAIL_USER
    mensaje["To"] = destino
    mensaje["Subject"] = "Recuperación de contraseña"
    mensaje.set_content(f"Tu contraseña es: {contrasena}")

    with smtplib.SMTP(MAIL_HOST, MAIL_PORT) as smtp:
        smtp.starttls()
        smtp.login(MAIL_USER, MAIL_PASSWORD)
        smtp.send_message(mensaje)
