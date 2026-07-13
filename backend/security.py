import hashlib
import hmac
import secrets
from datetime import datetime, timezone

from fastapi import HTTPException, Request, status

from database import get_connection


PASSWORD_ITERATIONS = 310_000
VALID_ROLES = {"admin", "analyst", "reviewer", "viewer"}


def hash_password(password, salt=None):
    salt_bytes = bytes.fromhex(salt) if salt else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_bytes,
        PASSWORD_ITERATIONS,
    )
    return digest.hex(), salt_bytes.hex()


def verify_password(password, expected_hash, salt):
    actual_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash)


def create_session_token():
    return secrets.token_urlsafe(48)


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def user_from_token(token):
    if not token:
        return None

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT u.id, u.username, u.display_name, u.role, u.active
        FROM auth_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = %s
          AND s.revoked_at IS NULL
          AND s.expires_at > CURRENT_TIMESTAMP
          AND u.active = TRUE
        """,
        (hash_token(token),),
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user


def bearer_token(request):
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip()


def get_current_user(request: Request):
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


def require_roles(*allowed_roles):
    allowed = set(allowed_roles)

    def dependency(request: Request):
        user = get_current_user(request)
        if user["role"] not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def utc_now():
    return datetime.now(timezone.utc)

