# Security policy

## Reporting a vulnerability

Please do not disclose security vulnerabilities in a public issue. Use GitHub's private vulnerability reporting feature when it is enabled for this repository. Include the affected component, reproduction steps, potential impact, and a safe proof of concept without real organizational data.

## Public-demo boundaries

- The published viewer credential is intentionally public and grants read-only access only in `DEMO_MODE`.
- Demo records and evidence references are synthetic.
- Full local deployments must use private credentials and must not expose Ollama or PostgreSQL directly to the internet.
- Secrets belong in environment variables or secret stores, never in committed files.

This portfolio prototype has not completed a production penetration test or compliance certification. Production use requires an independent security review, HTTPS, rate limiting, backups, monitoring, and hardened infrastructure.
