from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from audit import write_audit
from config import AUTH_SESSION_HOURS
from database import get_connection
from security import (
    VALID_ROLES,
    create_session_token,
    get_current_user,
    hash_password,
    hash_token,
    require_roles,
    verify_password,
)


router = APIRouter(prefix="/api/auth", tags=["authentication"])


class BootstrapRequest(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    display_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=10, max_length=200)


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BootstrapRequest):
    role: str = "viewer"


class UpdateRoleRequest(BaseModel):
    role: str
    active: bool = True


def serialize_user(user):
    return {
        "id": user["id"],
        "username": user["username"],
        "display_name": user["display_name"],
        "role": user["role"],
        "active": user["active"],
    }


def validate_password(password):
    if len(password) < 10 or not any(char.isalpha() for char in password) or not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must contain at least 10 characters, one letter, and one number",
        )


@router.get("/status")
def auth_status():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS count FROM users")
    count = int(cur.fetchone()["count"])
    cur.close()
    conn.close()
    return {"initialized": count > 0}


@router.post("/bootstrap", status_code=201)
def bootstrap_admin(payload: BootstrapRequest):
    validate_password(payload.password)
    username = payload.username.strip().lower()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT pg_advisory_xact_lock(%s)", (742019,))
    cur.execute("SELECT COUNT(*) AS count FROM users")
    if int(cur.fetchone()["count"]) > 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Platform account already initialized")

    password_hash, salt = hash_password(payload.password)
    cur.execute(
        """
        INSERT INTO users (username, display_name, password_hash, password_salt, role)
        VALUES (%s, %s, %s, %s, 'admin')
        RETURNING id, username, display_name, role, active
        """,
        (username, payload.display_name.strip(), password_hash, salt),
    )
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    write_audit(user, "bootstrap_admin", "user", user["id"], {"username": username})
    return {"user": serialize_user(user)}


@router.post("/login")
def login(payload: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, username, display_name, password_hash, password_salt, role, active
        FROM users
        WHERE username = %s
        """,
        (payload.username.strip().lower(),),
    )
    user = cur.fetchone()
    if not user or not user["active"] or not verify_password(payload.password, user["password_hash"], user["password_salt"]):
        cur.close()
        conn.close()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=AUTH_SESSION_HOURS)
    cur.execute(
        "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (%s, %s, %s)",
        (user["id"], hash_token(token), expires_at),
    )
    conn.commit()
    cur.close()
    conn.close()
    safe_user = serialize_user(user)
    write_audit(safe_user, "login", "session", details={"username": user["username"]})
    return {"token": token, "expires_at": expires_at, "user": safe_user}


@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"user": serialize_user(user)}


@router.post("/logout")
def logout(request: Request, user=Depends(get_current_user)):
    authorization = request.headers.get("Authorization", "")
    token = authorization.partition(" ")[2]
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = %s", (hash_token(token),))
    conn.commit()
    cur.close()
    conn.close()
    write_audit(user, "logout", "session")
    return {"message": "Logged out"}


@router.get("/users")
def list_users(user=Depends(require_roles("admin"))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, username, display_name, role, active, created_at FROM users ORDER BY id")
    users = cur.fetchall()
    cur.close()
    conn.close()
    return {"users": users}


@router.post("/users", status_code=201)
def create_user(payload: CreateUserRequest, user=Depends(require_roles("admin"))):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=422, detail="Invalid role")
    validate_password(payload.password)
    password_hash, salt = hash_password(payload.password)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO users (username, display_name, password_hash, password_salt, role)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, username, display_name, role, active, created_at
            """,
            (payload.username.strip().lower(), payload.display_name.strip(), password_hash, salt, payload.role),
        )
        created = cur.fetchone()
        write_audit(user, "create_user", "user", created["id"], {"role": payload.role}, conn=conn)
        conn.commit()
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Username already exists") from exc
    finally:
        cur.close()
        conn.close()
    return {"user": created}


@router.patch("/users/{user_id}")
def update_user(user_id: int, payload: UpdateRoleRequest, user=Depends(require_roles("admin"))):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=422, detail="Invalid role")
    if user_id == user["id"] and (not payload.active or payload.role != "admin"):
        raise HTTPException(status_code=409, detail="You cannot remove your own administrator access")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT role, active FROM users WHERE id = %s", (user_id,))
    existing = cur.fetchone()
    if not existing:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if existing["role"] == "admin" and existing["active"] and (payload.role != "admin" or not payload.active):
        cur.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND active = TRUE")
        if int(cur.fetchone()["count"]) <= 1:
            cur.close()
            conn.close()
            raise HTTPException(status_code=409, detail="At least one active administrator is required")
    cur.execute(
        """
        UPDATE users SET role = %s, active = %s WHERE id = %s
        RETURNING id, username, display_name, role, active, created_at
        """,
        (payload.role, payload.active, user_id),
    )
    updated = cur.fetchone()
    write_audit(user, "update_user", "user", user_id, {"role": payload.role, "active": payload.active}, conn=conn)
    conn.commit()
    cur.close()
    conn.close()
    return {"user": updated}
