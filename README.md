# NDMO Governance Intelligence Platform

An AI-powered, bilingual Data Governance platform designed to assess NDMO-aligned controls, analyze organizational evidence locally using Large Language Models (LLMs), measure data quality, and manage remediation from a unified workspace.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![Qwen](https://img.shields.io/badge/Local_AI-Qwen2.5-6C47FF)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-success?logo=githubactions)

> **Disclaimer**
>
> This is an independent portfolio project developed for educational and technical demonstration purposes. It is **not** an official NDMO product or certification tool. All demo data is synthetic.

---

# Live Demo

A public read-only version of the platform is available.

**Demo URL**

```
https://your-demo-url.com
```

### Demo Account

| Username | Password | Access |
|----------|----------|--------|
| demo.viewer | ViewOnly2026! | Read Only |

The public demo allows visitors to:

- View governance dashboards.
- Browse evidence analysis results.
- Explore Data Quality reports.
- Review recommendations.
- Navigate the platform.

The demo **cannot**:

- Upload evidence.
- Execute AI analysis.
- Modify assessments.
- Create users.
- Change remediation plans.

---

# Key Features

- AI-powered governance assessment
- 14 Governance Domains
- 42 Assessment Questions
- Local LLM inference using Qwen2.5
- Semantic Retrieval using BGE-M3
- Human Review Workflow
- Evidence Traceability
- Data Quality Assessment
- Remediation Tracking
- Audit Log
- Role-Based Access Control
- Arabic & English Interface
- Docker Deployment
- GitHub Actions CI

---

# Technology Stack

| Layer | Technology |
|---------|------------|
| Frontend | React 19 + Vite |
| Backend | FastAPI |
| Database | PostgreSQL |
| AI Models | Qwen2.5 + BGE-M3 |
| Local AI Runtime | Ollama |
| Containerization | Docker |
| CI/CD | GitHub Actions |

---

# System Architecture

```text
React Frontend
        │
        ▼
FastAPI Backend
        │
 ┌──────┴────────┐
 │               │
 ▼               ▼
PostgreSQL   Ollama
                 │
         ┌───────┴────────┐
         ▼                ▼
      BGE-M3         Qwen2.5
```

---

# Core Modules

## Governance Assessment

- Automated NDMO-aligned assessment
- Human validation
- Evidence mapping
- Confidence scoring

## Evidence Analysis

- Excel
- CSV
- PDF
- TXT

Semantic retrieval using multilingual embeddings.

## Data Quality

- Completeness
- Validity
- Uniqueness
- Missing Values
- Duplicate Detection
- PII Indicators

## Recommendations

Automatically generates remediation plans linked to governance findings.

## Audit Log

Every important action is stored for traceability.

---

# Local AI

The complete AI pipeline runs locally through Ollama.

Models:

- Qwen2.5
- BGE-M3

No external AI APIs are required.

---

# Running the Project

## Docker

```bash
docker compose up --build
```

Open

```
http://localhost:5173
```

---

## Local Development

```bash
python run_local.py
```

---

# Repository Structure

```text
backend/
frontend/
docs/
.github/
.devcontainer/
docker-compose.yml
run_local.py
README.md
SECURITY.md
CONTRIBUTING.md
```

---

# Verification

Backend

```bash
python -m unittest discover -s tests -v
```

Frontend

```bash
npm run lint
npm run build
```

GitHub Actions automatically validates every push.

---

# Roadmap

- Production Deployment
- Live AI Processing
- Background Jobs
- Model Evaluation Metrics
- Monitoring
- HTTPS
- Production Security Hardening

---

# Author

## Rana Hassan Kenani

AI Engineer specializing in:

- Artificial Intelligence
- Data Governance
- Local LLM Applications
- Machine Learning
- Enterprise AI Systems

**GitHub**

https://github.com/rahk2003

**LinkedIn**

https://www.linkedin.com/in/rana-kenani-/

---

# License

Copyright © 2026 Rana Hassan Kenani.

This project is intended for portfolio demonstration, education, and technical evaluation. Commercial use or redistribution requires permission.