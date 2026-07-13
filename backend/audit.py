import json

from database import get_connection


def write_audit(user, action, entity_type, entity_id=None, details=None, conn=None):
    owns_connection = conn is None
    connection = conn or get_connection()
    cur = connection.cursor()
    cur.execute(
        """
        INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
        VALUES (%s, %s, %s, %s, %s::jsonb)
        """,
        (
            user.get("id") if user else None,
            action,
            entity_type,
            str(entity_id) if entity_id is not None else None,
            json.dumps(details or {}, ensure_ascii=False, default=str),
        ),
    )
    cur.close()
    if owns_connection:
        connection.commit()
        connection.close()

