# LinkedIn screenshot and carousel guide

Use the English interface for the LinkedIn launch post and keep every visible record synthetic. Capture the browser content only; crop out browser tabs, local file paths, email tabs, and the `127.0.0.1` address bar.

## Recommended carousel order

### 1. Cover — Dashboard

Capture:

- The complete sidebar and top navigation.
- Overall compliance, data-quality score, evidence coverage, and critical findings.
- The domain compliance chart.

Suggested caption:

> A unified view of governance posture, evidence coverage, and data quality.

This should be the first image because it communicates the product in a single frame.

### 2. Local AI evidence analysis

Capture:

- The Evidence Analysis page in English.
- One completed result with decision, confidence, reasoning, evidence excerpt, and source location.
- The Qwen connected indicator in the sidebar when using the full local profile.

Suggested caption:

> Traceable evidence assessment with multilingual semantic retrieval and local Qwen inference.

Avoid showing an active file picker, a local filesystem path, or a network error banner.

### 3. Domain assessment and human oversight

Capture:

- One expanded governance requirement.
- Effective decision and decision source.
- Supporting evidence panel.
- Manual review panel.

Suggested caption:

> Automated decisions remain reviewable, explainable, and linked to their source evidence.

### 4. Data-quality intelligence

Capture:

- Overall data-quality score.
- Completeness, uniqueness, and validity cards.
- Column profiles or issue summary.

Suggested caption:

> Data-quality profiling with column-level findings and PII indicators.

### 5. Recommendations and remediation

Capture:

- Three recommendation cards with different priorities.
- Evidence reference, confidence, owner, due date, and status.

Suggested caption:

> Governance findings converted into owned and auditable remediation work.

### 6. Architecture slide

Use the Mermaid architecture diagram from the main README or recreate it as a clean slide:

```text
React UI → FastAPI → PostgreSQL
                 ↘ Evidence extraction → BGE-M3 → Qwen2.5
```

Suggested caption:

> Privacy-conscious architecture for local evidence processing and traceable decisions.

## Visual checklist

- Use one language per carousel; English is recommended for reach.
- Keep the same browser size and zoom across screenshots.
- Use a 4:5 carousel canvas where possible and place screenshots inside consistent margins.
- Make the dashboard the cover image.
- Keep text readable on mobile; crop unused whitespace.
- Show `Portfolio Visitor` or `Demo Viewer`, not a personal email address.
- Use only filenames beginning with `Synthetic_` or similarly obvious demo names.
- Do not show the published demo password inside screenshots; keep it in the GitHub README.
- Add a small footer: `Independent portfolio prototype · Synthetic data`.
