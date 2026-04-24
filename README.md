# ⚡ TaskForge — AI Task Processing Platform

A production-ready MERN stack application for asynchronous AI text-processing tasks, deployed with Kubernetes, Argo CD, and a full CI/CD pipeline.

---

## Architecture

```
React Frontend (nginx) ──► Node.js API ──► MongoDB
                                │
                            Redis Queue
                                │
                         Python Worker(s) ──► MongoDB
```

### Services
| Service | Tech | Port |
|---|---|---|
| Frontend | React + nginx | 3000 (local) / 80 (k8s) |
| Backend API | Node.js + Express | 5000 |
| Worker | Python 3.12 | — (queue consumer) |
| Database | MongoDB 7 | 27017 |
| Queue | Redis 7 | 6379 |

### Supported Operations
- `uppercase` — Convert text to UPPERCASE
- `lowercase` — Convert text to lowercase
- `reverse` — Reverse the string
- `word_count` — Count words in text

---

## Quick Start (Docker Compose)

### Prerequisites
- Docker & Docker Compose v2

### 1. Clone and configure
```bash
git clone https://github.com/YOUR_ORG/taskforge.git
cd taskforge

# Create backend environment file
cp backend/.env.example backend/.env
# Edit backend/.env — set a strong JWT_SECRET (min 32 chars)
```

### 2. Start all services
```bash
docker compose up --build
```

### 3. Open the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- Python 3.12+
- MongoDB 7 running locally
- Redis 7 running locally

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local MONGODB_URI and Redis settings
npm run dev
```

### Worker
```bash
cd worker
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

export MONGODB_URI=mongodb://localhost:27017/ai-task-platform
export REDIS_HOST=localhost
python worker.py
```

### Frontend
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
```

---

## Kubernetes Deployment

### Prerequisites
- A running Kubernetes cluster (k3s, EKS, GKE, etc.)
- `kubectl` and `kustomize` installed
- `argocd` CLI installed

### 1. Install Argo CD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

### 2. Configure secrets
```bash
# Edit k8s/base/secrets.yaml with your base64-encoded secrets
echo -n 'your-jwt-secret-min-32-chars' | base64

kubectl apply -f k8s/base/secrets.yaml
```

### 3. Apply Argo CD apps
```bash
# Update repoURL in infra/argocd-apps.yaml first
kubectl apply -f infra/argocd-apps.yaml
```

### 4. Access Argo CD UI
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open https://localhost:8080
```

### Manual apply (without Argo CD)
```bash
# Production
kubectl apply -k k8s/overlays/production

# Staging
kubectl apply -k k8s/overlays/staging
```

---

## CI/CD Setup

### Required GitHub Secrets
| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `INFRA_REPO` | Infra repo slug (e.g. `org/taskforge-infra`) |
| `INFRA_REPO_TOKEN` | GitHub PAT with write access to infra repo |

### Pipeline Flow
1. **Lint** — ESLint (backend/frontend), flake8 (worker)
2. **Build & Push** — Multi-stage Docker builds, push to Docker Hub with SHA tag
3. **Update Infra** — Commit updated image tags to infra repo
4. **Argo CD** — Detects infra repo change, syncs cluster automatically

---

## API Reference

### Authentication
```
POST /api/auth/register   { username, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me         (requires Bearer token)
```

### Tasks
```
GET    /api/tasks                    List tasks (paginated)
POST   /api/tasks                    Create task
GET    /api/tasks/:id                Get task details + logs
DELETE /api/tasks/:id                Delete task
GET    /api/tasks/stats/summary      Task stats by status
```

### Health
```
GET /health          Full health check (MongoDB + Redis)
GET /health/ready    Readiness probe
```

---

## Project Structure

```
taskforge/
├── backend/
│   ├── src/
│   │   ├── config/         # DB, Redis, Logger
│   │   ├── middleware/      # Auth, Error handler
│   │   ├── models/          # User, Task
│   │   ├── routes/          # auth, tasks, health
│   │   ├── app.js
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
├── worker/
│   ├── worker.py            # Redis consumer + DB fallback
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, TaskCard, StatusBadge, etc.
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useTasks
│   │   ├── pages/           # Login, Register, Dashboard, TaskDetail
│   │   └── utils/           # axios client
│   ├── nginx.conf
│   └── Dockerfile
├── k8s/
│   ├── base/                # Namespace, ConfigMap, Secrets, Deployments
│   └── overlays/
│       ├── staging/         # 1 replica, debug logs
│       └── production/      # 3 replicas, HPA
├── infra/
│   └── argocd-apps.yaml     # Argo CD Application manifests
├── .github/workflows/
│   └── ci-cd.yml
├── docker-compose.yml
├── ARCHITECTURE.md
└── README.md
```

---

## Security Notes

- Never commit `.env` files or `k8s/base/secrets.yaml` with real values.
- Use **Sealed Secrets** or **External Secrets Operator** in production for GitOps-safe secret management.
- Rotate `JWT_SECRET` periodically — existing tokens will be invalidated.
- Enable MongoDB authentication in production by setting `MONGO_INITDB_ROOT_USERNAME/PASSWORD` and updating the connection URI.
- Enable Redis `requirepass` in production and set `REDIS_PASSWORD` secret accordingly.
