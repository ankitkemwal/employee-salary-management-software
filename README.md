# ACME Salary Management System

Web application replacing ACME's Excel-based salary process for its HR team — a
single source of truth for compensation data across 10,000 employees in
multiple countries.



## Stack

- **Backend**: Node.js + Express + TypeScript, Drizzle ORM over SQLite
  (via `node:sqlite`, Node's built-in driver — no native build toolchain
  required), Zod validation, Jest + Supertest tests.
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS v4, a small
  hand-built shadcn-style component set, React Router.

## Project layout

```
backend/    Express API, Drizzle schema, services, seed script, tests
frontend/   React SPA (directory, employee detail, forms, dashboard)
```

## Getting started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # defaults are fine for local dev
npm run seed                # creates data/app.db and seeds 10,000 employees
npm run dev                 # http://localhost:4000
```

`npm run seed` re-creates the schema and wipes/reseeds all tables — safe to
re-run any time you want a clean slate.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env         # VITE_API_BASE_URL=/api (proxied to the backend in dev)
npm run dev                  # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000` (see
`frontend/vite.config.ts`), so the two `npm run dev` processes just need to
both be running.

### 3. Tests

```bash
cd backend
npm test        # Jest + Supertest — services and routes, in-memory SQLite per file
```

## Deployment

- **Frontend → Vercel**: point Vercel at `frontend/`, framework preset "Vite".
  `frontend/vercel.json` adds the SPA rewrite Vercel needs for client-side
  routing. Set `VITE_API_BASE_URL` to the deployed backend's URL
  (e.g. `https://your-api.up.railway.app/api`).
- **Backend → Railway**: point Railway at `backend/`. It builds with
  `npm run build` (compiles TypeScript and copies `ddl.sql` into `dist/`) and
  runs `npm start`. Set `CORS_ORIGIN` to the deployed frontend's origin and
  `DATABASE_URL` to a path on a mounted persistent volume (SQLite is a single
  file — without a volume it resets on every redeploy). Run `npm run seed`
  once via Railway's shell after the first deploy.
- Swapping SQLite for Postgres in production is a Drizzle dialect/driver
  change, not a rewrite — see REQUIREMENTS.md § Technical Choices.

## Notes on a few implementation choices

- **`node:sqlite` instead of `better-sqlite3`**: this avoids a native
  build-toolchain dependency entirely (no node-gyp, no MSVC/Python setup)
  while keeping full SQL access through Drizzle's `sqlite-proxy` driver.
- **Append-only salary history**: `POST /api/employees/:id/salary` always
  inserts; nothing is ever updated or deleted from `salary_records`. "Current
  salary" is resolved via a `ROW_NUMBER()` CTE ordered by effective date.
- **Currency-safe dashboard**: payroll totals and averages are grouped by
  currency and never summed across currencies (see REQUIREMENTS.md § 3).
