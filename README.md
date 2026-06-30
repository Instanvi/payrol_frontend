# Payroll template

Mini payroll app with a **Next.js** frontend (`payment-template`) and an **Express + Drizzle** API backend (`payment-backend`).

## Quick start

### 1. Backend

```bash
cd payment-backend
npm install
cp .env.example .env
npm run db:setup    # push schema + seed demo data
npm run dev         # http://localhost:4000
```

### 2. Frontend

In another terminal:

```bash
cd payment-template
npm install
cp .env.example .env
npm run dev         # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api` in `payment-template/.env` to use the Express API.

Without `NEXT_PUBLIC_API_URL`, the app uses Next.js mock routes under `/api`.

---

## Backend (`payment-backend`)

See [payment-backend/README.md](../payment-backend/README.md) for architecture, auth flow, and API routes.

Demo login: `owner@acme.com` / `password123` → 2FA code `123456`

---

## Frontend stack

Next.js 16, React 19, shadcn/ui, TanStack Query & Table, react-hook-form, Zod, **Auth.js** (credentials provider).

### Auth flow (frontend)

1. Login form → `POST /auth/login` (Express or mock API) → stores `challengeToken` in sessionStorage
2. 2FA form → Auth.js `signIn("credentials", { challengeToken, code })` → JWT session cookie
3. API requests → axios reads `accessToken` from Auth.js session via `getSession()`
4. Logout → Auth.js `signOut()`

Set `AUTH_SECRET` in `.env` (see `.env.example`).

Demo login: `owner@acme.com` / `password123` → 2FA `123456`
