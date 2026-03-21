# BuildLoop

AI-assisted Product Management and Developer Workspace — built for teams who want to turn raw user feedback into shipped features, fast.

## What it does

- **Feedback Ingestion** — paste interview transcripts or survey text, get it chunked and embedded automatically
- **AI Insight Clustering** — Claude synthesises feedback into labelled themes with sentiment, frequency, and representative quotes
- **Feature Prioritisation** — insights get ranked into a scored feature backlog with effort and impact estimates
- **Kanban Board** — lightweight task board generated directly from product insights
- **Codebase Q&A** — upload your code files and ask questions in plain English, grounded in your actual codebase

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas |
| Vector DB | Pinecone |
| LLM | Claude (claude-sonnet-4-20250514) |
| Embeddings | Voyage AI (voyage-3) |
| Auth | Clerk |
| Storage | GCP Cloud Storage |
| Hosting | GCP Cloud Run |
| CI/CD | GitHub Actions |

## Project Structure
```
buildloop/
├── apps/
│   ├── web/          # React + TypeScript frontend
│   └── api/          # Express + TypeScript backend
├── docker-compose.yml
└── .env.example
```

## Team

| Name | Role | Owns |
|---|---|---|
| Prableen | Full Stack | Feedback Ingestion · Insights UI |
| Jagjeevan | Full Stack | Feature Prioritisation · Kanban Board |
| Eshaa | Full Stack | Auth · Workspace UI · GCP Deployment |
| Arshdeep | ML/AI | Embeddings · Pinecone · Claude Services · RAG |

## Local Setup
```bash
# 1. Clone and copy env
git clone https://github.com/your-org/BuildLoop.git
cd BuildLoop
cp .env.example .env

# 2. Start local MongoDB
docker-compose up -d

# 3. Run API (port 4000)
cd apps/api && npm install && npm run dev

# 4. Run web client (port 5173)
cd apps/web && npm install && npm run dev
```

## Environment Variables
```
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=
MONGODB_URI=
CLERK_SECRET_KEY=
GCP_BUCKET_NAME=
```

## Sprint Timeline

| Phase | Dates | Focus |
|---|---|---|
| 1 | Mar 23–28 | Foundation — monorepo, schemas, auth, Pinecone setup |
| 2 | Mar 29–Apr 6 | Backend Core — all API routes + AI services |
| 3 | Apr 7–15 | Frontend Build — all 5 pages + components |
| 4 | Apr 16–22 | Integration — end-to-end feature flows |
| 5 | Apr 23–27 | Polish + Testing — QA, rate limiting, Sentry |
| 6 | Apr 28–30 | Deploy — GCP Cloud Run + GitHub Actions |

## Branch Naming
```
feat/name-description
fix/name-description
chore/name-description
```

PRs require 1 review before merge to `main`. Keep PRs scoped to one feature.
