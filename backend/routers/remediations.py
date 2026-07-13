from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from audit import write_audit
from database import get_connection
from security import require_roles


router = APIRouter(prefix="/api/remediations", tags=["remediations"])


class RemediationUpdate(BaseModel):
    result_id: int | None = None
    question_id: int | None = None
    domain_id: int | None = None
    owner_name: str | None = None
    due_date: date | None = None
    status: str = "Open"
    notes: str | None = None


@router.put("/{recommendation_key}")
def save_remediation(
    recommendation_key: str,
    payload: RemediationUpdate,
    user=Depends(require_roles("admin", "analyst", "reviewer")),
):
    if payload.status not in {"Open", "In Progress", "Resolved"}:
        raise HTTPException(status_code=422, detail="Invalid remediation status")

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO remediation_actions
        (recommendation_key, result_id, question_id, domain_id, owner_name, due_date, status, notes, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (recommendation_key) DO UPDATE SET
            result_id = COALESCE(EXCLUDED.result_id, remediation_actions.result_id),
            question_id = COALESCE(EXCLUDED.question_id, remediation_actions.question_id),
            domain_id = COALESCE(EXCLUDED.domain_id, remediation_actions.domain_id),
            owner_name = EXCLUDED.owner_name,
            due_date = EXCLUDED.due_date,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_by = EXCLUDED.updated_by,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
        """,
        (
            recommendation_key,
            payload.result_id,
            payload.question_id,
            payload.domain_id,
            payload.owner_name.strip() if payload.owner_name else None,
            payload.due_date,
            payload.status,
            payload.notes,
            user["id"],
            user["id"],
        ),
    )
    action = cur.fetchone()
    write_audit(user, "save_remediation", "remediation", action["id"], {"key": recommendation_key, "status": payload.status}, conn=conn)
    conn.commit()
    cur.close()
    conn.close()
    return {"action": action}

