import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


def _load_local_env():
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_local_env()

DB_NAME = os.getenv("DB_NAME", "ndmo_platform")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))

DATABASE_URL = os.getenv("DATABASE_URL")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:4173,http://127.0.0.1:4173",
    ).split(",")
    if origin.strip()
]

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(25 * 1024 * 1024)))
MAX_EVIDENCE_UPLOAD_BYTES = int(os.getenv("MAX_EVIDENCE_UPLOAD_BYTES", str(100 * 1024 * 1024)))
MAX_DATASET_UPLOAD_BYTES = int(os.getenv("MAX_DATASET_UPLOAD_BYTES", str(MAX_UPLOAD_BYTES)))
MAX_EXCEL_UNCOMPRESSED_BYTES = int(os.getenv("MAX_EXCEL_UNCOMPRESSED_BYTES", str(512 * 1024 * 1024)))
AUTH_SESSION_HOURS = int(os.getenv("AUTH_SESSION_HOURS", "12"))
EVIDENCE_UPLOAD_DIR = BASE_DIR / os.getenv("EVIDENCE_UPLOAD_DIR", "uploaded_evidence")
