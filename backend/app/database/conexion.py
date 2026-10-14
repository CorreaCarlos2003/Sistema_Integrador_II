import os
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

SERVER = os.getenv("DB_SERVER","localhost")
PORT = os.getenv("DB_PORT", "5432")
DATABASE = os.getenv("DB_NAME", "bd_chat_postgres")
USER = os.getenv("DB_USER", "postgres")
PASSWORD = os.getenv("DB_PASSWORD", "root")

postgres_url = (
    f"postgresql://{urllib.parse.quote_plus(USER)}:{urllib.parse.quote_plus(PASSWORD)}"
    f"@{SERVER}:{PORT}/{DATABASE}"
)

engine = create_engine(postgres_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
