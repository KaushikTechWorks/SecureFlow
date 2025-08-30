# SecureFlow AWS → Fly.io Migration Architecture

## 1. Executive Summary
SecureFlow has been migrated from a multi‑service AWS serverless stack (CloudFront + S3 + API Gateway + Lambda + RDS Postgres) to a simplified, container + managed Postgres model on Fly.io. The new platform reduces moving parts, improves deployment velocity, and keeps global edge delivery via Fly's anycast network while preserving core backend ML anomaly detection functionality.

---
## 2. High-Level Architecture (Before vs After)

### Previous (AWS)
```
 User ─▶ CloudFront (CDN)
              │
              ▼ (static)
           S3 Bucket (React build)
              │  /api/*
              ▼
        API Gateway (REST)
              │ (invoke)
              ▼
          Lambda (Flask app logic + model)
              │ (SQLAlchemy/psycopg2)
              ▼
        Amazon RDS (PostgreSQL)
```
Supporting: IAM Roles, CloudWatch Logs, VPC + Security Groups, Parameter Store/Env.

### Current (Fly.io)
```
 User ─▶ Fly Global Anycast Edge ─┬─────────────────────────────────┐
                                  │                                 │
                                  ▼                                 ▼
                        Frontend App (secureflow)
                        (nginx serving React build)
                             │  proxy /api → backend over Fly private network
                             ▼
                    Backend App (secureflow-backend)
                    (Flask + Gunicorn + IsolationForest + SHAP)
                             │ (SQLAlchemy / psycopg2)
                             ▼
                        Fly Postgres Cluster
```
Observability: Fly logs / metrics. Secrets: Fly app secrets. Networking: Fly internal 6PN (private network) + public edge.

---
## 3. Component Mapping
| AWS Component            | Purpose                               | Fly.io Replacement / Current | Notes |
|--------------------------|---------------------------------------|------------------------------|-------|
| CloudFront CDN + S3      | Static asset hosting + CDN            | Fly app (nginx) + Fly edge   | Single container build; can add CDN layer later if needed |
| API Gateway              | REST routing / auth / throttling      | Direct HTTPS to backend app  | Simplified; add rate limiting via middleware if required |
| Lambda (Python)          | Stateless execution environment       | Persistent container (Flask) | Faster warm paths; responsibility for scaling now via Fly autoscaling |
| RDS PostgreSQL           | Relational storage                    | Fly Postgres                 | Managed HA; consider read replica for analytics later |
| IAM Roles / Policies     | Fine-grained access control           | Fly secrets + app perms      | Scope only DB + app secrets (no AWS service calls) |
| CloudWatch Logs          | Central logging & metrics             | Fly log streaming / metrics  | Option: ship to external log store (Vector, Loki) |
| Security Groups / VPC    | Network segmentation                  | Fly org private 6PN + firewall | Internal-only DB exposure |

---
## 4. Runtime & Networking Details
- Frontend container (nginx) listens on internal port 80; Fly assigns public HTTPS.
- Backend container listens on port 5001 (Gunicorn). Frontend `nginx.conf` proxies `/api/*` to `https://secureflow-backend.fly.dev` (could be switched to private DNS `http://secureflow-backend.internal:5001`).
- Fly Postgres accessed via DATABASE_URL secret (stored in Fly). Network path stays within Fly’s private network.

Ports:
- 80/443 (edge → frontend)
- 443 (edge → backend if called directly) / 5001 internal
- Postgres default 5432 (private only)

---
## 5. Deployment Flow (Current)
1. Developer commits changes to `main`.
2. Manual deploy (current):
   - Backend: `fly deploy` inside `backend/` (uses `fly.toml`).
   - Frontend: `fly deploy` inside `frontend/` (React build → nginx image).
3. Fly builds images remotely (Depot builder) and rolls out with zero‑downtime strategy.
4. Scaling: Fly auto-start/stop (as configured) + manual scale commands available.

Suggested CI (future): GitHub Actions pipeline with separate jobs for backend and frontend deploying only on tagged releases or `main` merges.

---
## 6. Data & ML Layer
- Model: IsolationForest + StandardScaler; in-memory lazy initialization at first request.
- SHAP explanations (placeholder) provided; real SHAP computation can be added using background thread or cached pre-computation.
- Schema: Recreated clean via SQLAlchemy after legacy mismatch; normalization layer handles legacy vs new payloads.

---
## 7. Security & Secrets
| Concern        | AWS (Before)             | Fly (Now)                                   |
|----------------|--------------------------|---------------------------------------------|
| Secret Storage | Lambda env / Parameter Store | Fly secrets (encrypted at rest)           |
| Network Access | VPC security groups      | Private 6PN + restricted Postgres exposure  |
| TLS            | CloudFront / API GW cert | Fly managed certificates (auto TLS)         |
| Auth (App)     | None (placeholder)       | Still placeholder (client-only)             |

Next step: Introduce proper auth (JWT or OAuth) & rate-limiting middleware.

---
## 8. Advantages After Migration
- Simplified cognitive load: fewer managed services.
- Lower cold start latency vs Lambda.
- Unified container workflow (Docker parity local/prod).
- Faster iteration (single deploy vs multi-service orchestration).
- Cost predictability (particularly at moderate sustained traffic).

Trade-offs:
- Must manage scaling thresholds manually (no implicit Lambda concurrency scaling).
- Need to implement custom auth / throttling not provided by API Gateway.

---
## 9. Future Enhancements
| Area              | Recommendation |
|-------------------|---------------|
| Auth & Security   | Add Auth0 / Cognito alternative, JWT middleware, per-route RBAC |
| Rate Limiting     | Implement middleware (e.g., Redis or in-memory token bucket) |
| Observability     | Add structured logging + metrics exporter (OTEL / Prometheus) |
| Caching           | Edge cache static + API GET responses (Fly Machines w/ CDN or external CDN) |
| Resilience        | Multi-region active/standby backend; Postgres read replica |
| Storage           | Evaluate object storage (Backblaze, Cloudflare R2) for large assets |
| Model Serving     | Move model to separate service if memory/CPU grows |
| CI/CD             | GitHub Actions workflows (lint/test/build/deploy) |

---
## 10. Quick Reference
- Frontend App: `secureflow` (nginx, React build)
- Backend App: `secureflow-backend` (Flask/Gunicorn)
- Postgres: Fly managed cluster (DATABASE_URL secret)
- Primary Endpoints: `/api/health`, `/api/predict`, `/api/predict-batch`, `/api/feedback`, `/api/dashboard`, `/api/transactions`
- Source of Truth: This repository (monorepo style: `frontend/`, `backend/`)

---
## 11. Migration Checklist (Completed)
- [x] Initialize Fly Postgres instance
- [x] Containerize backend with Gunicorn
- [x] Recreate schema & normalize input payloads
- [x] Deploy backend (`secureflow-backend`)
- [x] Containerize + deploy frontend with API proxy
- [x] Theme & UI parity adjustments (Login, Home hero)
- [x] Replace AI wording → ML
- [x] Commit & push Fly configs

---
## 12. Diagram (Sequence – Prediction Request)
```
User Browser → Frontend (nginx) → /api/predict → Backend Flask
  Backend: ensure model initialized → Normalize Payload → IsolationForest.predict
      → Store transaction + feedback stub → Return JSON (risk scores)
  Backend → Postgres (INSERT + SELECT) over private network
```

---
**Document Owner:** Migration automation (generated)
**Last Updated:** $(date placeholder – update as needed)
