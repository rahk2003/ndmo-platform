from fastapi import APIRouter, Depends, Query

from database import get_connection
from security import require_roles


router = APIRouter(prefix="/api/audit-log", tags=["audit"])


@router.get("")
def get_audit_log(
    limit: int = Query(100, ge=1, le=500),
    user=Depends(require_roles("admin", "reviewer")),
):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
               u.username, u.display_name
        FROM audit_log a
        LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT %s
        """,
        (limit,),
    )
    entries = cur.fetchall()
    cur.close()
    conn.close()
    return {"entries": entries}

