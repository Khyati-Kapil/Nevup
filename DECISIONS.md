# DECISIONS

## React + Vite for fast iteration and Lighthouse reproducibility
I used React with Vite to keep the UI iteration cycle fast while still producing deterministic production builds for Lighthouse CI checks. This made it easier to tune the debrief flow, dashboard rendering, and mobile behavior repeatedly under the 72-hour constraint.

## Contract-first API integration with normalization guards
I introduced an API contract layer (`zod` parsing + normalization) before data reaches UI components. The mock API can evolve or return partial fields; normalizing input at the boundary reduces runtime UI failures, keeps component logic simple, and helps enforce predictable empty/error states.

## SSE coaching stream with explicit reconnect/backoff states
The coaching panel uses `EventSource` with exponential backoff and a user-visible status model (`connecting`, `live`, `reconnecting`, `offline`). This was chosen to meet the track requirement for graceful degradation on dropped connections instead of frozen or blank UI.

## Accessible keyboard-first debrief progression
The debrief flow manages step focus intentionally and supports keyboard progression (Tab navigation, Enter/Arrow step controls). I prioritized this architecture because keyboard-only completion is explicitly graded, and focus management is easiest to keep reliable when state transitions are centralized.

## Custom SVG heatmap implementation
The 90-day quality heatmap is custom SVG instead of a calendar component library to satisfy the no-off-the-shelf heatmap requirement. SVG also gives us direct control over cell-level interaction (hover tooltip/title and click-to-debrief) with minimal rendering overhead.

## Two-service Docker Compose for one-command reviewer startup
I added `docker-compose.yml` with both the Prism mock API and frontend app so reviewers can run a single `docker compose up` command. This aligns with the global rule of no manual multi-step setup and keeps local evaluation close to judging conditions.
