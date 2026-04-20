# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BuildLoop is an AI-assisted Product Management and Developer Workspace that turns user feedback into shipped features. It uses an npm workspace monorepo with a React frontend and Node.js backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + ES Modules |
| Database | MongoDB Atlas (Mongoose ODM) |
| Vector DB | Pinecone |
| LLM | Claude (Anthropic SDK) + Gemini |
| Embeddings | Voyage AI |
| Auth | Clerk |
| State | Zustand (client) + TanStack Query (server) |

## Common Commands

```bash
# Install dependencies for both frontend and backend
npm install

# Start both services concurrently (frontend:5173, backend:5000)
npm run dev

# Start services individually
npm run dev:frontend    # Vite dev server
npm run dev:backend     # Nodemon with auto-reload

# Build frontend
npm run build           # From root
npm run build:frontend  # From root, or cd buildloop-frontend && npm run build

# Production
npm start               # Starts backend only

# Lint (frontend only)
cd buildloop-frontend && npm run lint
```

## High-Level Architecture

### Backend Structure (`buildloop-backend/src/`)

The backend follows a layered architecture with clear separation of concerns:

```
routes/       # Express route definitions (index.js aggregates all routes)
controllers/  # Request handlers, validate input, call services
services/     # Business logic, AI service integration (synthesis, prioritization, workspace)
models/       # Mongoose schemas (Feedback, Insight, Feature, Task, Workspace, Project)
middleware/   # Clerk authentication, error handling
lib/          # Database connections (mongo.js, pinecone.js, gemini.js, voyage.js)
utils/        # AppError utility for consistent error handling
```

**Authentication Flow:**
- All `/api/*` routes protected by Clerk JWT verification (`verifyClerkAuth` middleware)
- Frontend includes Bearer token in Authorization header from `@clerk/clerk-react`
- User ID attached to `req.auth.userId` for ownership checks

**AI/RAG Pipeline:**
1. `ingestion.service.js` - Chunks feedback text, embeds via Voyage AI, stores in Pinecone
2. `synthesis.service.js` - Queries Pinecone for feedback chunks, sends to Gemini for clustering
3. `prioritization.service.js` - Scores features by impact/effort using LLM
4. `workspace.service.js` - RAG chat with codebase using Claude API and conversation history

### Frontend Structure (`buildloop-frontend/src/`)

```
pages/        # Route-level components (Dashboard, Feedback, Insights, Features, Kanban, Workspace)
components/   # UI organized by domain: ui/, feedback/, insights/, kanban/, workspace/
store/        # Zustand stores: projectStore.js, uiStore.js
api/          # API client layer with axios
hooks/        # Custom React hooks
lib/          # QueryClient (TanStack Query), utility functions
```

**Routing:** Lazy-loaded routes with 2-second minimum delay for PageLoader effect. Routes wrapped in ClerkProvider for auth.

**State Management:**
- Server state: TanStack Query (1-minute staleTime, 1 retry)
- Client state: Zustand stores
- Auth: Clerk React SDK

**Styling (Glassmorphism Design System):**
- Tailwind config defines custom colors: `brand`, `success`, `warn`, `danger`, `base`
- No font-bold allowed; use `font-semibold` max
- No Inter/Roboto; use `Plus Jakarta Sans` (font-sans) and `JetBrains Mono` (font-mono)
- Glass patterns: `bg-white/10 backdrop-blur-md border border-white/20 rounded-card`
- Icons: Lucide React only

## Data Models

Key Mongoose models in `buildloop-backend/src/models/`:

- **Feedback** - User feedback with source (paste/file/url), chunked text, pineconeIds
- **Insight** - AI-generated clusters from feedback: clusterLabel, summary, sentiment, frequency
- **Feature** - Prioritized features with impact/effort scores
- **Task** - Kanban board items with status (todo/in-progress/done)
- **Workspace** - Codebase upload metadata and conversation history

## Environment Variables

**Backend** (`buildloop-backend/.env`):
```env
PORT=5000
NODE_ENV=development
CLERK_SECRET_KEY=          # From Clerk Dashboard
VOYAGE_API_KEY=            # For embeddings
ANTHROPIC_API_KEY=         # For Claude API
PINECONE_API_KEY=          # Vector database
PINECONE_INDEX=            # Pinecone index name
MONGODB_URI=               # MongoDB Atlas connection string
MONGODB_DB_NAME=buildloop
AWS_REGION=                # For file uploads
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

**Frontend** (`buildloop-frontend/.env.local`):
```env
VITE_CLERK_PUBLISHABLE_KEY=  # From Clerk Dashboard
```

## API Structure

All endpoints prefixed with `/api` and require authentication:

| Route | Purpose |
|-------|---------|
| POST /api/feedback | Ingest feedback (paste/file/url) |
| GET /api/insights/:projectId | Get synthesized insights |
| POST /api/insights/generate | Trigger AI synthesis |
| GET /api/features/:projectId | Get prioritized features |
| GET /api/tasks/:projectId | Get Kanban tasks |
| PUT /api/tasks/:id | Update task status |
| POST /api/workspace/upload | Upload codebase files |
| POST /api/workspace/chat | RAG chat with codebase |
| GET /api/projects | List user projects |

## Key Patterns

**Error Handling:**
```javascript
// Backend: throw AppError for known errors
try {
  const result = await service.call();
  res.json({ success: true, data: result });
} catch (err) {
  next(err); // Global handler returns { success: false, message: err.message }
}
```

**Database Transactions:**
MongoDB transactions used for multi-document operations (e.g., synthesis replaces all insights atomically).

**API Response Format:**
```javascript
{ success: true/false, data: {...} }  // Success
{ success: false, message: "..." }     // Error
```

## File Conventions

- **Backend**: ES modules (`.js` with `import/export`), async/await
- **Frontend**: JSX components, lazy imports for pages
- **Git branches**: `feat/name-description`, `fix/name-description`, `chore/name-description`
- PRs require 1 review before merge to `main`

## External Services Integration

- **Clerk**: User authentication via JWT tokens
- **Pinecone**: Vector search for feedback chunks (namespace per project)
- **Voyage AI**: Text embeddings (voyage-3 model)
- **Gemini**: Feedback synthesis and feature prioritization
- **Claude API**: Workspace chat with codebase context and citations
- **GCP Cloud Storage**: Codebase file uploads (via AWS S3-compatible API)
