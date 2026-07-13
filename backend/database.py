import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine
from sqlalchemy.engine import URL

from config import DATABASE_URL, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER


engine_url = DATABASE_URL or URL.create(
    "postgresql+psycopg2",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
)
engine = create_engine(engine_url, pool_pre_ping=True)


def get_connection():
    if DATABASE_URL:
        psycopg_url = DATABASE_URL.replace(
            "postgresql+psycopg2://",
            "postgresql://",
            1,
        )
        return psycopg2.connect(
            psycopg_url,
            cursor_factory=RealDictCursor,
        )
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        cursor_factory=RealDictCursor,
    )
