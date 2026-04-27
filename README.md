# NevUp Hackathon 2026 - Track 3 (System of Engagement)

Frontend implementation for post-session debrief and behavioral dashboard.
This project now includes a **seeded local mock API** that reads `nevup_seed_dataset.csv`.

## Tech Stack
- React + Vite
- React Router
- Framer Motion
- Axios
- Zod
- Lighthouse CI
- Seeded mock API: Express + CSV parser

## Seeded Data Requirement
- Seed file path in repo: `data/nevup_seed_dataset.csv`
- Mock API startup loads this CSV into memory and serves Track 3 endpoints.

## Run with Docker (reviewer path)
```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:4173`
- Seeded Mock API: `http://localhost:4010`

## Run locally (dev path)
1. Start seeded mock API:
```bash
cd mock-api
npm install
npm start
```
2. Start frontend in another terminal:
```bash
npm install
npm run dev
```

## Implemented Track 3 Endpoints (seeded)
- `GET /api/sessions/:id`
- `GET /api/users/:id/metrics`
- `GET /api/users/:id/profile`
- `POST /api/sessions/:id/debrief`
- `GET /api/sessions/:id/coaching` (SSE token streaming)


## Auth and Tenancy
- Frontend auto-generates a demo JWT (HS256, 24h expiry) in browser storage for local testing.
- API enforces JWT validation and tenancy (`sub === requestedUserId`) with:
  - `401` for missing/invalid/expired token
  - `403` for cross-tenant access
- Error bodies include `traceId`, and API logs include structured `traceId/userId/latency/statusCode`.

## Environment Variables
- `VITE_API_BASE_URL` default: `http://localhost:4010`
- `VITE_DEMO_USER_ID` default: `f412f236-4edc-47a2-8f54-8763a6ed2ce8`
- `VITE_DEMO_SESSION_ID` default: `4f39c2ea-8687-41f7-85a0-1fafd3e976df`

## Quality Checks
```bash
npm run lint
npm run build
npm run lhci:autorun
```

Lighthouse CI config: `lighthouserc.json`.

## Required Screenshots for Submission
Add screenshots to `docs/screenshots/` and reference them below.

### Dashboard Component
- Loading state: `docs/screenshots/dashboard-loading.png`
- Error state: `docs/screenshots/dashboard-error.png`
- Empty state: `docs/screenshots/dashboard-empty.png`

### Debrief Component
- Loading state: `docs/screenshots/debrief-loading.png`
- Error state: `docs/screenshots/debrief-error.png`
- Empty state: `docs/screenshots/debrief-empty.png`

### Coaching Panel
- Reconnecting/error resilience state: `docs/screenshots/coaching-reconnecting.png`

## Notes
- In this coding environment, LHCI may fail if Chrome is unavailable. Run LHCI locally on your machine (with Chrome) for final JSON artifacts.
