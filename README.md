# NevUp Hackathon 2026 - Track 3 (System of Engagement)

Frontend implementation for post-session debrief and behavioral dashboard, integrated against the provided `nevup_openapi.yaml` mock API contract.

## Tech Stack
- React + Vite
- React Router
- Framer Motion
- Axios
- Zod
- Lighthouse CI

## Run with Docker (reviewer path)
```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:4173`
- Prism Mock API: `http://localhost:4010`

## Run locally (dev path)
1. Start mock API:
```bash
npx @stoplight/prism-cli mock nevup_openapi.yaml --host 0.0.0.0 --port 4010
```
2. Start frontend in another terminal:
```bash
npm install
npm run dev
```

## Environment Variables
- `VITE_API_BASE_URL` default: `http://localhost:4010`
- `VITE_DEMO_USER_ID` default: `f412f236-4edc-47a2-8f54-8763a6ed2ce8`
- `VITE_DEMO_SESSION_ID` default: `session-1`

## Implemented Track 3 Requirements
- 5-step post-session debrief flow with per-step transitions
- Real-time coaching panel via SSE with reconnect/backoff states
- Custom SVG 90-day heatmap (no heatmap library)
- Click heatmap cell to open related debrief route
- Explicit loading, error (with retry), and empty states
- Keyboard navigation + focus management for debrief flow

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
