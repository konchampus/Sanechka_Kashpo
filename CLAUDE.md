# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Sanechka Kashpo" / "SanRottan" — a small pottery shop the owner is building for his mother. Two workspaces in one repo: `backend/` (Express + MongoDB) and `frontend/` (Next.js 15 Pages Router). All UI copy, log messages, and code comments are in Russian — keep that language when editing existing strings or adding new user-facing text.

## Common commands

Backend (`cd backend`):
- `npm run dev` — nodemon on `server.js`, listens on `:5000`
- `npm start` — plain node
- `npm test` — jest (no test files exist yet; runner is configured but the suite is empty)

Frontend (`cd frontend`):
- `npm run dev` — Next.js dev server on `:3000`
- `npm run build` / `npm start` — production build
- `npm run lint` — `next lint` (ESLint flat config in `eslint.config.mjs`)
- `npm run test:e2e` — Playwright across chromium/firefox/webkit + mobile (`playwright.config.js`). The config auto-spawns `npm run dev` via `webServer`, so don't start the frontend manually before running. There is no `tests/` directory yet — `testDir: './tests'` is wired but empty.
- Single Playwright test: `npx playwright test path/to/spec.js -g "name"` (or use `--project=chromium` to skip the cross-browser matrix during dev).

Required env (`.env` files are not checked in):
- Backend: `MONGODB_URI`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_ID`, optional `ADMIN_ORDER_URL`, `PORT`. Setting `NODE_ENV=test` skips both `mongoose.connect` and the Telegram bot launch (used so jest doesn't dial real services).
- Frontend: `NEXT_PUBLIC_API_URL` overrides the default backend URL (`http://localhost:5000` in browser, `http://backend:5000` SSR — see `frontend/lib/axios.js`).

## Architecture

### Backend is a monolith in `server.js`

`backend/server.js` (~1000 lines) holds almost the entire API: Mongoose schemas, JWT/admin middleware, multer upload config, and every route handler except photos. Models are declared inline — `User`, `Product`, `Order`, `Banner`, `PromoCode`, `Review`, `Visit`, `OrderCounter`, `AnalyticsEvent` — so when a feature touches a new collection, look at `server.js` first, not `backend/models/`. Only `Photo` is split out into `models/Photo.js` + `routes/photos.js` + `controllers/photos.js` and mounted at `/api/photos`. Reusable middleware (`auth`, `admin`, `upload` with transliterated filenames) lives in `backend/middleware/index.js`, but `server.js` defines its **own** copies of `auth`/`admin` and its own multer storage — the two paths are not unified. When changing auth/admin behavior, update both.

Two non-obvious cross-cutting behaviors:
- **Manual sanitizer middleware** (server.js ~line 39) strips Mongo operators (`$`, `.` keys) and HTML-escapes every string in `req.body`/`query`/`params`. This means strings reach handlers already escaped (`&lt;` instead of `<`) — keep this in mind when comparing or rendering values.
- **Order numbers** are issued by an atomic `OrderCounter` upsert (`findOneAndUpdate { $inc: value }`) — don't replace this with `Order.countDocuments` or `Date.now()`.

File uploads land in `backend/uploads/` and are served at `/uploads/*` via `express.static`. The directory is git-ignored (commit `102794d`); never commit binaries there. Two upload flows coexist: the legacy `/api/admin/products` multipart form that creates a product and its files together, and the newer instant-upload endpoints (`/api/admin/upload-media`, `/api/admin/products/:id/media`, `/api/admin/products/:id/media-order`) that the admin UI uses for drag-and-drop.

The Telegram bot (Telegraf) sends a formatted HTML message to `ADMIN_TELEGRAM_ID` on every new order. The bot is created lazily and skipped entirely when `NODE_ENV=test`.

### Frontend is Next.js 15 Pages Router (not App Router)

Routes are `frontend/pages/*.js`. Admin pages live under `pages/admin/` and product detail at `pages/product/[id].js`. Shared UI is in `components/`, helpers in `lib/`.

- **All HTTP goes through `lib/axios.js`** — it injects the JWT from a cookie (`token`), normalizes `Content-Type` (skips it for `FormData`), surfaces every error as a toast via `lib/notifications.js`, and on 401 clears cookies and hard-redirects to `/login`. New API calls should import this instance, not raw `axios`.
- **Admin route protection is client-side only**, in `pages/_app.js`: if `router.route` starts with `/admin` and the `role` cookie isn't `admin`, redirect to `/login`. The real authorization is the JWT `admin` middleware on the backend — never assume the cookie alone is trustworthy.
- `_app.js` also fires a `/api/visits` ping (with IP from `api.ipify.org`) and wraps the page in a `GlobalErrorBoundary` that catches `window.onerror` / `unhandledrejection` and shows a toast.
- A `shownToasts` set deduplicates identical toast messages within a 2s window — when adding new notifications, prefer the helpers in `lib/notifications.js` over calling `react-toastify` directly.
- `next.config.mjs` hardcodes `http://localhost:5000` in the CSP `img-src`, `media-src`, and `connect-src` directives. Any deployment to a non-localhost backend must update that CSP, otherwise images and API calls will be blocked. The same is true of `domains: ['localhost']` for `next/image`.
- Webpack cache is disabled (`config.cache = false`) — dev builds will be slower than expected; that's intentional, don't "fix" it without asking.

### Data flow for orders (the most cross-cutting feature)

`POST /api/orders` accepts both authenticated and guest checkout. Guest orders capture `guestData` (name/phone/address); on user registration, `Order.updateMany({ 'guestData.phone': phone, userId: null }, { $set: { userId } })` retroactively links guest orders to the new account. There's also `POST /api/orders/claim-guest-orders` for already-registered users to claim by phone or email. Stock is decremented inside the same handler that creates the order (no transaction — best-effort), and the Telegram notification is sent after `order.save()`.
