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
BuildLoop/
├── buildloop-frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       │   ├── feedback/
│       │   ├── features/
│       │   ├── insights/
│       │   ├── kanban/
│       │   ├── ui/
│       │   └── workspace/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── store/
│       └── types/
│
├── buildloop-backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── lib/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       │   └── prompts/
│       └── utils/
│
├── .env.example
├── .gitignore
└── README.md
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
# 1. Clone repo
git clone https://github.com/your-org/BuildLoop.git
cd BuildLoop

# 2. Run API (port 5000 by default)
cd buildloop-backend
cp .env.example .env
npm install
npm run dev

# 3. Run web client (port 5173)
# In a new terminal tab:
cd buildloop-frontend
npm install
npm run dev
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
