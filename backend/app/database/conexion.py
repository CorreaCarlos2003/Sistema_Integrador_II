import os
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
SERVER = os.getenv("DB_SERVER", r"localhost\SQLEXPRESS")
DATABASE = os.getenv("DB_NAME", "BD_CHAT")
TRUSTED = os.getenv("DB_TRUSTED", "yes").lower() in {"1", "true", "yes"}
USER = os.getenv("DB_USER", "")
PASSWORD = os.getenv("DB_PASSWORD", "")

if TRUSTED:
    params = f"DRIVER={{{DRIVER}}};SERVER={SERVER};DATABASE={DATABASE};Trusted_Connection=yes;TrustServerCertificate=yes;"
else:
    params = f"DRIVER={{{DRIVER}}};SERVER={SERVER};DATABASE={DATABASE};UID={USER};PWD={PASSWORD};TrustServerCertificate=yes;"

odbc_url = f"mssql+pyodbc:///?odbc_connect={urllib.parse.quote_plus(params)}"

engine = create_engine(odbc_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
