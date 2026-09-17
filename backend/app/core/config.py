import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = "cambiar-en-produccion"
ALGORITMO = "HS256"
MAIL_USER = os.getenv("MAIL_USER", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "").replace(" ", "")
MAIL_HOST = os.getenv("MAIL_HOST", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))