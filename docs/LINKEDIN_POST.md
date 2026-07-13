# LinkedIn launch post

I’m excited to share a project I’ve been building: the **NDMO Governance Intelligence Platform** — an independent, bilingual prototype for data-governance assessment, evidence analysis, data quality, and remediation tracking.

The idea started with a practical challenge: governance evidence is often distributed across spreadsheets, policies, ownership records, and review notes. Even when the information exists, connecting each compliance decision to its exact source can be slow and difficult to audit.

I designed this platform to bring that workflow into one traceable workspace.

### What the platform includes

- An Arabic and English governance dashboard with full RTL/LTR support
- 14 NDMO-aligned data-governance domains and 42 reference assessment questions
- Local analysis of Excel, CSV, PDF, and TXT evidence
- Multilingual semantic retrieval using **BGE-M3**
- Structured evidence decisions using **Qwen2.5 7B Instruct** through Ollama
- Human review and correction of automated decisions
- Data-quality profiling for completeness, uniqueness, validity, column issues, and PII indicators
- Evidence-linked recommendations, remediation owners, due dates, and status tracking
- Role-based access control and an auditable activity history

One of my main design priorities was **traceability**. The platform does not only return a score. Each automated assessment stores its confidence, reasoning, evidence excerpt, and source location so that a reviewer can understand and challenge the decision.

I also wanted the AI workflow to remain privacy-conscious. In the full local profile, evidence processing, semantic retrieval, and Qwen inference run locally through Ollama rather than sending organizational files to an external AI API.

For the public portfolio demo, I created a separate read-only environment with entirely synthetic data and precomputed assessment results. The repository also includes Docker Compose, a GitHub Codespaces configuration, automated tests, and CI checks.

This is a portfolio prototype — not an official NDMO product or certification tool — and there is still more I want to explore, including a reviewed control library, model evaluation benchmarks, background job processing, and a domain-specific fine-tuning dataset.

I’d value feedback from professionals working in data governance, compliance, data quality, and applied AI. Which part of this workflow would be most useful in a real governance team?

**GitHub:** add repository link here  
**Demo:** add hosted demo link here

#DataGovernance #ArtificialIntelligence #MachineLearning #DataQuality #Compliance #FastAPI #React #PostgreSQL #SaudiTech

---

## Shorter alternative

I’m excited to share my latest portfolio project: the **NDMO Governance Intelligence Platform**.

It is a bilingual Arabic/English prototype that combines governance assessment, local AI evidence analysis, data-quality profiling, remediation tracking, role-based access, and audit history in one traceable workspace.

The full local AI workflow uses **BGE-M3** for multilingual semantic retrieval and **Qwen2.5 7B Instruct** through Ollama for structured evidence assessment. Every decision is linked to confidence, reasoning, an evidence excerpt, and its source location, with human review built into the process.

The public demo uses only synthetic data and provides a read-only viewer experience through Docker or GitHub Codespaces.

This is an independent portfolio prototype, not an official NDMO product or certification tool. I’d appreciate feedback from anyone working in data governance, compliance, data quality, or applied AI.

**GitHub:** add repository link here  
**Demo:** add hosted demo link here

#DataGovernance #AI #DataQuality #Compliance #FastAPI #React #PostgreSQL
