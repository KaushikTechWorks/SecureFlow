# SecureFlow Current Architecture (Fly.io)

> Snapshot of the production setup running entirely on Fly.io. This complements `FLY_MIGRATION_ARCHITECTURE.md` by focusing only on the *current* state.

---
## 1. Logical Overview
```
Users (Browser)
   │
   ▼  HTTPS (Anycast Edge)
Fly Global Edge Network
   │
   ├── Frontend App  (App: secureflow)
   │       Container: nginx + React build (port 80)
   │       Routes:     /  (SPA)  |  /static/* (assets)
   │       Proxy:      /api/*  → https://secureflow-backend.fly.dev (or internal)
   │
   └── Backend App   (App: secureflow-backend)
           Container: Python (Flask + Gunicorn, port 5001)
           Responsibilities:
             - Transaction prediction (IsolationForest)
             - Batch prediction
             - Dashboard metrics aggregation
             - Feedback ingestion
             - Transaction storage & retrieval
           Data Flow:
             - Lazy model + scaler initialization on first request
             - Normalize payload → predict → store → respond
             - SHAP placeholder explanations (risk factors heuristics)
             - SQLAlchemy ORM writes/reads to Postgres

Fly Postgres Cluster
   │  (Managed HA Postgres, private network access)
   └─ Schemas: transactions, feedback, (future: users, auth, risk_rules)
```

---
## 2. Deployment Units
| Component | Fly App Name        | Image Source                | Internal Port | Scaling | Notes |
|-----------|---------------------|-----------------------------|---------------|---------|-------|
| Frontend  | secureflow          | Dockerfile (React → nginx)  | 80            | 1+ (manual/auto) | Serves static + proxies /api |
| Backend   | secureflow-backend  | Dockerfile (Python Gunicorn)| 5001          | 1+ (auto start/stop) | ML model in-process |
| Database  | (managed cluster)   | Fly Postgres                | 5432          | HA (1 primary) | DATABASE_URL secret |

---
## 3. Data Model (Current Minimal)
Tables (simplified):
```
transactions(
  id SERIAL PK,
  amount NUMERIC,
  hour INT,
  day_of_week INT,
  merchant_category INT,
  transaction_type INT,
  is_fraudulent BOOLEAN,
  confidence FLOAT,
  anomaly_score FLOAT,
  created_at TIMESTAMP
)

feedback(
  id SERIAL PK,
  transaction_id INT FK -> transactions.id,
  is_correct BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP
)
```
Future: user_accounts, api_keys, risk_rule_overrides, model_versions.

---
## 4. Request Lifecycle (Example: /api/predict)
1. Browser POST → `https://secureflow.fly.dev/api/predict`
2. Nginx (frontend) proxies to backend app.
3. Flask `predict` endpoint:
   - Ensure model/scaler initialized
   - Normalize request (support legacy shape)
   - Run IsolationForest → anomaly score
   - Derive boolean classification & confidence heuristic
   - Persist transaction row
   - Return JSON: { is_fraudulent, confidence, risk_factors, data_source, timestamp }
4. Response bubbles back through nginx to user.

---
## 5. Secrets & Config
| Name            | Purpose                          | Location |
|-----------------|----------------------------------|----------|
| DATABASE_URL    | SQLAlchemy connection string     | Fly secret (backend app) |
| (Future) JWT_SECRET | Auth token signing           | (to be added) |

Config Files:
- Backend: `backend/fly.toml`
- Frontend: `frontend/fly.toml`
- Nginx Proxy Rules: `frontend/nginx.conf`

---
## 6. Observability & Ops
| Aspect      | Current | Planned Improvement |
|-------------|---------|---------------------|
| Logs        | Fly logs (stdout) | Ship to aggregator (Vector → Loki/Grafana) |
| Metrics     | Fly basic metrics | Add Prometheus exporter / OTEL traces |
| Alerts      | None | Add health + error rate alerts |
| Tracing     | None | Introduce OpenTelemetry middleware |

---
## 7. Security Posture
- TLS: Managed automatically by Fly.
- Network: Backend & Postgres communicate over Fly private network (no public DB exposure).
- Attack Surface Reduction: Fewer public endpoints (only frontend & backend), no exposed AWS gateway layers.
- Pending: Authentication & authorization, rate limiting, input validation hardening.

---
## 8. Scaling & Performance
| Layer     | Current Strategy                         | Future |
|-----------|-------------------------------------------|--------|
| Frontend  | Single machine; scale manually if needed  | Auto scale on concurrency/latency |
| Backend   | Single machine; auto start/stop           | Multi-region deployment & horizontal scale |
| Database  | Single primary                            | Read replicas / failover region |

Model Considerations: If model size or complexity increases → extract to dedicated inference service or serverless GPU (modal, replicate) with caching.

---
## 9. Operational Runbook (Condensed)
| Task              | Command / Action |
|-------------------|------------------|
| Deploy Frontend   | `fly deploy` in `frontend/` |
| Deploy Backend    | `fly deploy` in `backend/`  |
| Set DB URL Secret | `fly secrets set DATABASE_URL=...` |
| Open Logs         | `fly logs -a secureflow-backend` |
| Scale Backend     | `fly scale count 2 -a secureflow-backend` |

---
## 10. Risks & Next Steps
| Risk / Gap            | Mitigation Plan |
|-----------------------|-----------------|
| No auth / RBAC        | Add JWT + user table + protected routes |
| No rate limiting      | Implement middleware (leaky bucket + Redis) |
| Single region         | Add secondary region; enable latency-based routing |
| Basic logging only    | Introduce structured JSON logs + central store |
| Manual deployments    | Add CI/CD pipeline (GitHub Actions) |
| Model transparency    | Integrate true SHAP computation + caching |

---
**Last Updated:** $(date placeholder – update when modifying)
