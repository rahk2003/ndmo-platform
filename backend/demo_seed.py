import os
import re

from database import get_connection
from security import hash_password


DOMAINS = [
    (1, "Data Governance", "حوكمة البيانات"),
    (2, "Metadata Management", "إدارة البيانات الوصفية"),
    (3, "Data Quality", "جودة البيانات"),
    (4, "Data Classification", "تصنيف البيانات"),
    (5, "Data Sharing", "مشاركة البيانات"),
    (6, "Open Data", "البيانات المفتوحة"),
    (7, "Personal Data Protection", "حماية البيانات الشخصية"),
    (8, "Data Architecture", "معمارية البيانات"),
    (9, "Reference and Master Data", "إدارة البيانات المرجعية والرئيسية"),
    (10, "Data Integration", "تكامل البيانات"),
    (11, "Business Intelligence & Analytics", "ذكاء الأعمال والتحليلات"),
    (12, "Data Operations", "عمليات البيانات"),
    (13, "Documents and Content Management", "إدارة الوثائق والمحتوى"),
    (14, "Data Value Realization", "قيمة البيانات"),
]

QUESTION_TEMPLATES = [
    (
        1,
        "Is there a documented policy or procedure for this domain?",
        "هل توجد سياسة أو إجراء موثق يخص هذا المجال؟",
    ),
    (
        2,
        "Is there an assigned owner responsible for this domain?",
        "هل يوجد مالك مسؤول عن هذا المجال؟",
    ),
    (
        3,
        "Is this domain measured and improved periodically?",
        "هل يتم قياس وتحسين هذا المجال بشكل دوري؟",
    ),
]

DEMO_MODE = os.getenv("DEMO_MODE", "false").strip().lower() in {"1", "true", "yes", "on"}
DEMO_VIEWER_USERNAME = os.getenv("DEMO_VIEWER_USERNAME", "demo.viewer").strip().lower()
DEMO_VIEWER_PASSWORD = os.getenv("DEMO_VIEWER_PASSWORD", "ViewOnly2026!")
DEMO_VIEWER_DISPLAY_NAME = os.getenv("DEMO_VIEWER_DISPLAY_NAME", "Portfolio Visitor").strip()
DEMO_EVIDENCE_PREFIX = "Synthetic_Demo_"
DEMO_QUALITY_FILE = "synthetic_customer_master.csv"


def seed_reference_catalog():
    """Create the public domain/question catalog without overwriting existing content."""
    conn = get_connection()
    cur = conn.cursor()

    for order_number, name_en, name_ar in DOMAINS:
        cur.execute("SELECT id FROM ndmo_domains WHERE name_en = %s", (name_en,))
        domain = cur.fetchone()
        if domain:
            domain_id = domain["id"]
        else:
            cur.execute(
                """
                INSERT INTO ndmo_domains (name_ar, name_en, description, order_number)
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (
                    name_ar,
                    name_en,
                    "Portfolio reference domain for the synthetic NDMO-aligned assessment demo.",
                    order_number,
                ),
            )
            domain_id = cur.fetchone()["id"]

        for question_number, question_en, question_ar in QUESTION_TEMPLATES:
            question_code = f"D{order_number:02d}_Q{question_number:02d}"
            cur.execute("SELECT 1 FROM ndmo_questions WHERE question_code = %s", (question_code,))
            if cur.fetchone():
                continue
            cur.execute(
                """
                INSERT INTO ndmo_questions
                    (domain_id, question_code, question_text_ar, question_text_en, evidence_required, max_score)
                VALUES (%s, %s, %s, %s, TRUE, 100)
                """,
                (domain_id, question_code, question_ar, question_en),
            )

    conn.commit()
    cur.close()
    conn.close()


def demo_decision(order_number, question_number):
    if question_number == 1:
        if order_number in {6, 13}:
            return "no"
        if order_number in {5, 7, 11}:
            return "partial"
        return "yes"
    if question_number == 2:
        if order_number in {12}:
            return "no"
        if order_number in {4, 9, 14}:
            return "partial"
        return "yes"
    if order_number in {1, 3, 10}:
        return "yes"
    if order_number in {2, 4, 8, 11, 14}:
        return "partial"
    return "no"


def demo_reason(answer, domain_name):
    if answer == "yes":
        return f"Approved synthetic evidence demonstrates implementation and ownership for {domain_name}."
    if answer == "partial":
        return f"Synthetic evidence is relevant to {domain_name}, but approval, coverage, or review cadence is incomplete."
    return f"The synthetic evidence package does not contain sufficient proof for this {domain_name} requirement."


def ensure_demo_viewer(cur):
    password_hash, password_salt = hash_password(DEMO_VIEWER_PASSWORD)
    cur.execute(
        """
        INSERT INTO users (username, display_name, password_hash, password_salt, role, active)
        VALUES (%s, %s, %s, %s, 'viewer', TRUE)
        ON CONFLICT (username) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            password_hash = EXCLUDED.password_hash,
            password_salt = EXCLUDED.password_salt,
            role = 'viewer',
            active = TRUE
        RETURNING id
        """,
        (DEMO_VIEWER_USERNAME, DEMO_VIEWER_DISPLAY_NAME, password_hash, password_salt),
    )
    return cur.fetchone()["id"]


def seed_demo_assessments(cur):
    cur.execute(
        """
        SELECT q.id, q.question_code, q.question_text_en,
               d.id AS domain_id, d.order_number, d.name_en AS domain_name
        FROM ndmo_questions q
        JOIN ndmo_domains d ON d.id = q.domain_id
        ORDER BY d.order_number, q.id
        """
    )
    questions = cur.fetchall()
    evidence_by_domain = {}

    for question in questions:
        domain_id = question["domain_id"]
        if domain_id not in evidence_by_domain:
            slug = re.sub(r"[^a-z0-9]+", "_", question["domain_name"].lower()).strip("_")
            filename = f"{DEMO_EVIDENCE_PREFIX}{slug}.pdf"
            cur.execute("SELECT id FROM ndmo_evidence WHERE file_name = %s", (filename,))
            evidence = cur.fetchone()
            if evidence:
                evidence_id = evidence["id"]
            else:
                status = "Under Review" if question["order_number"] in {5, 7, 11} else "Approved"
                cur.execute(
                    """
                    INSERT INTO ndmo_evidence
                        (question_id, file_name, file_path, evidence_type, status, reviewer_notes)
                    VALUES (%s, %s, %s, 'Policy', %s, %s)
                    RETURNING id
                    """,
                    (
                        question["id"],
                        filename,
                        f"demo://{filename}",
                        status,
                        "Synthetic portfolio evidence. No real organization data is included.",
                    ),
                )
                evidence_id = cur.fetchone()["id"]
            evidence_by_domain[domain_id] = evidence_id

        evidence_id = evidence_by_domain[domain_id]
        cur.execute(
            """
            SELECT 1 FROM ndmo_ai_assessment_results
            WHERE question_id = %s AND evidence_id = %s
            """,
            (question["id"], evidence_id),
        )
        if cur.fetchone():
            continue

        question_number = int(question["question_code"].rsplit("Q", 1)[1])
        answer = demo_decision(question["order_number"], question_number)
        confidence = {"yes": 92, "partial": 78, "no": 87}[answer]
        reason = demo_reason(answer, question["domain_name"])
        cur.execute(
            """
            INSERT INTO ndmo_ai_assessment_results
                (question_id, evidence_id, ai_answer, confidence, reason, evidence_text, evidence_location)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                question["id"],
                evidence_id,
                answer,
                confidence,
                reason,
                f"Synthetic control record for {question['domain_name']}: {question['question_text_en']}",
                f"Synthetic evidence register / {question['question_code']}",
            ),
        )


def seed_demo_quality_report(cur):
    cur.execute("SELECT id FROM data_quality_reports WHERE file_name = %s", (DEMO_QUALITY_FILE,))
    report = cur.fetchone()
    if report:
        return report["id"]

    cur.execute(
        """
        INSERT INTO data_quality_reports
            (asset_name, file_name, total_rows, total_columns, missing_values, duplicate_rows,
             completeness_score, uniqueness_score, validity_score, quality_score, applied_rules)
        VALUES (%s, %s, 25000, 18, 325, 41, 99.93, 99.84, 96.40, 98.66,
                '{"required_columns":["Customer_ID","Full_Name","Email"],"unique_columns":["Customer_ID"]}'::jsonb)
        RETURNING id
        """,
        ("Synthetic Customer Master Dataset", DEMO_QUALITY_FILE),
    )
    report_id = cur.fetchone()["id"]
    profiles = [
        ("Customer_ID", "string", 25000, 0, 24959, 82, 100.0, None),
        ("Full_Name", "string", 25000, 85, 23120, 0, 100.0, "name"),
        ("Email", "string", 25000, 140, 24620, 0, 96.4, "email"),
        ("Data_Owner", "string", 25000, 100, 14, 0, 100.0, None),
    ]
    for profile in profiles:
        cur.execute(
            """
            INSERT INTO data_quality_column_results
                (report_id, column_name, data_type, total_values, missing_values,
                 unique_values, duplicate_values, validity_score, pii_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (report_id, *profile),
        )
    issues = [
        ("Email", 418, "invalid_format", "synthetic.invalid.email"),
        ("Full_Name", 1220, "missing_value", ""),
        ("Data_Owner", 2087, "missing_value", ""),
        (None, 9042, "duplicate_row", ""),
    ]
    for issue in issues:
        cur.execute(
            """
            INSERT INTO data_quality_issues
                (report_id, column_name, row_number, issue_type, issue_value)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (report_id, *issue),
        )
    return report_id


def seed_demo_review_history(cur):
    cur.execute("SELECT 1 FROM ndmo_ai_training_examples WHERE notes = %s", ("Synthetic portfolio review",))
    if cur.fetchone():
        return
    cur.execute(
        """
        SELECT id, question_id, evidence_id, ai_answer, evidence_text, evidence_location
        FROM ndmo_ai_assessment_results
        WHERE ai_answer IN ('no', 'partial')
        ORDER BY id
        LIMIT 6
        """
    )
    for result in cur.fetchall():
        corrected = "partial" if result["ai_answer"] == "no" else "yes"
        cur.execute(
            """
            INSERT INTO ndmo_ai_training_examples
                (question_id, evidence_id, evidence_text, evidence_location,
                 predicted_answer, corrected_answer, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                result["question_id"],
                result["evidence_id"],
                result["evidence_text"],
                result["evidence_location"],
                result["ai_answer"],
                corrected,
                "Synthetic portfolio review",
            ),
        )


def seed_demo_remediations(cur):
    cur.execute(
        """
        SELECT r.id AS result_id, r.question_id, q.domain_id
        FROM ndmo_ai_assessment_results r
        JOIN ndmo_questions q ON q.id = r.question_id
        WHERE r.ai_answer IN ('no', 'partial')
        ORDER BY r.id
        LIMIT 4
        """
    )
    for index, result in enumerate(cur.fetchall(), start=1):
        cur.execute(
            """
            INSERT INTO remediation_actions
                (recommendation_key, result_id, question_id, domain_id,
                 owner_name, due_date, status, notes)
            VALUES (%s, %s, %s, %s, %s, CURRENT_DATE + (%s * INTERVAL '14 days'), %s, %s)
            ON CONFLICT (recommendation_key) DO NOTHING
            """,
            (
                f"ai-result-{result['result_id']}",
                result["result_id"],
                result["question_id"],
                result["domain_id"],
                "Data Governance Office",
                index,
                "In Progress" if index <= 2 else "Open",
                "Synthetic remediation plan for portfolio demonstration.",
            ),
        )


def seed_demo_environment():
    if not DEMO_MODE:
        return
    if len(DEMO_VIEWER_PASSWORD) < 10:
        raise RuntimeError("DEMO_VIEWER_PASSWORD must contain at least 10 characters")

    conn = get_connection()
    cur = conn.cursor()
    try:
        ensure_demo_viewer(cur)
        seed_demo_assessments(cur)
        seed_demo_quality_report(cur)
        seed_demo_review_history(cur)
        seed_demo_remediations(cur)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
