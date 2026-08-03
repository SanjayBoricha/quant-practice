# AGENTS.md

## Architecture

Single-page Vue 3 app (Vite) with a small Express.js API backed by MongoDB via Mongoose.

- `src/App.vue` — root component; owns all state (`chapters`, `hardQuestions`), fetches from the API on mount, and passes data/handlers down to `ChapterCard`.
- `src/components/ChapterCard.vue` — one chapter's card: completed-count controls, progress ring, and a collapsible panel to manage hard/flagged question numbers for that chapter.
- `server.js` — Express API server exposing `/api/chapters` and `/api/hard-questions` endpoints.
- `db/index.js` — MongoDB connection helper.
- `db/schema.js` — Mongoose schemas for `Chapter` and `HardQuestion`.
- `.github/workflows/deploy.yml` — GitHub Pages deployment for the static frontend.

## Conventions

- API routes are Express handlers with JSON request/response semantics.
- Frontend does optimistic local state updates, then fires the corresponding API call; on failure it surfaces a dismissible error banner rather than silently failing.
- Bootstrap classes are used for layout/components; visual identity (gradient hero, progress ring, pill badges) lives in `src/style.css`.
- MongoDB documents use Mongoose schemas, and object IDs are serialized as strings for API clients.

## Non-obvious decisions

- Chapters are seeded lazily on the first `GET /api/chapters` call rather than via a migration script.
- "Hard questions" store the question number as free text (not an integer) since users may reference questions like "12b" or "DI set 3, Q2".
