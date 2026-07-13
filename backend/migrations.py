from database import get_connection


MIGRATIONS = [
    (
        "000_base_schema",
        """
        CREATE TABLE IF NOT EXISTS organizations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            sector VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ndmo_domains (
            id SERIAL PRIMARY KEY,
            name_ar TEXT NOT NULL,
            name_en TEXT NOT NULL,
            description TEXT,
            order_number INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS ndmo_questions (
            id SERIAL PRIMARY KEY,
            domain_id INTEGER NOT NULL REFERENCES ndmo_domains(id) ON DELETE CASCADE,
            question_code TEXT NOT NULL,
            question_text_ar TEXT NOT NULL,
            question_text_en TEXT,
            evidence_required BOOLEAN DEFAULT TRUE,
            max_score INTEGER DEFAULT 100
        );

        CREATE TABLE IF NOT EXISTS ndmo_evidence (
            id SERIAL PRIMARY KEY,
            question_id INTEGER REFERENCES ndmo_questions(id) ON DELETE SET NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            evidence_type TEXT,
            status TEXT DEFAULT 'Uploaded',
            reviewer_notes TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ndmo_answers (
            id SERIAL PRIMARY KEY,
            question_id INTEGER NOT NULL REFERENCES ndmo_questions(id) ON DELETE CASCADE,
            answer_value TEXT NOT NULL,
            score INTEGER NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS data_quality_reports (
            id SERIAL PRIMARY KEY,
            asset_name VARCHAR(255) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            total_rows INTEGER NOT NULL,
            total_columns INTEGER NOT NULL,
            missing_values INTEGER NOT NULL,
            duplicate_rows INTEGER NOT NULL,
            completeness_score NUMERIC(6, 2) NOT NULL,
            uniqueness_score NUMERIC(6, 2) NOT NULL,
            quality_score NUMERIC(6, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ndmo_ai_assessment_results (
            id SERIAL PRIMARY KEY,
            question_id INTEGER REFERENCES ndmo_questions(id) ON DELETE CASCADE,
            evidence_id INTEGER REFERENCES ndmo_evidence(id) ON DELETE CASCADE,
            ai_answer VARCHAR(20) NOT NULL,
            confidence INTEGER NOT NULL,
            reason TEXT,
            evidence_text TEXT,
            evidence_location TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
    ),
    (
        "001_platform_security_and_workflow",
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'reviewer', 'viewer')),
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS auth_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            revoked_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id BIGSERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            details JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS remediation_actions (
            id BIGSERIAL PRIMARY KEY,
            recommendation_key TEXT UNIQUE NOT NULL,
            result_id INTEGER REFERENCES ndmo_ai_assessment_results(id) ON DELETE CASCADE,
            question_id INTEGER REFERENCES ndmo_questions(id) ON DELETE SET NULL,
            domain_id INTEGER REFERENCES ndmo_domains(id) ON DELETE SET NULL,
            owner_name TEXT,
            due_date DATE,
            status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
            notes TEXT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS data_quality_column_results (
            id BIGSERIAL PRIMARY KEY,
            report_id INTEGER NOT NULL REFERENCES data_quality_reports(id) ON DELETE CASCADE,
            column_name TEXT NOT NULL,
            data_type TEXT NOT NULL,
            total_values INTEGER NOT NULL,
            missing_values INTEGER NOT NULL,
            unique_values INTEGER NOT NULL,
            duplicate_values INTEGER NOT NULL,
            validity_score NUMERIC(6, 2) NOT NULL,
            pii_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(report_id, column_name)
        );

        CREATE TABLE IF NOT EXISTS data_quality_issues (
            id BIGSERIAL PRIMARY KEY,
            report_id INTEGER NOT NULL REFERENCES data_quality_reports(id) ON DELETE CASCADE,
            column_name TEXT,
            row_number INTEGER,
            issue_type TEXT NOT NULL,
            issue_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
        CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_remediation_status ON remediation_actions(status);
        CREATE INDEX IF NOT EXISTS idx_quality_issues_report ON data_quality_issues(report_id);
        """,
    ),
    (
        "002_data_quality_details",
        """
        ALTER TABLE data_quality_reports
            ADD COLUMN IF NOT EXISTS validity_score NUMERIC(6, 2) NOT NULL DEFAULT 100;
        ALTER TABLE data_quality_reports
            ADD COLUMN IF NOT EXISTS applied_rules JSONB NOT NULL DEFAULT '{}'::jsonb;
        """,
    ),
]


def run_migrations():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()

    for version, sql in MIGRATIONS:
        cur.execute("SELECT 1 FROM schema_migrations WHERE version = %s", (version,))
        if cur.fetchone():
            continue
        cur.execute(sql)
        cur.execute("INSERT INTO schema_migrations(version) VALUES (%s)", (version,))
        conn.commit()

    cur.close()
    conn.close()
