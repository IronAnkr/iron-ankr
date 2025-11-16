Analytics: Page Views

- Purpose: Record page view start/end with device info, IP, and user.
- Table: `page_views` (created by migration in `supabase/migrations/1768572000_page_views.sql`).
- Client: `src/app/components/analytics/page-view-tracker.tsx` auto-sends start/end.
- Wiring: Included globally in `src/app/layout.tsx`.

Data captured
- user: Auth user id (via Supabase cookies) if logged in.
- ip: From `x-forwarded-for`/`x-real-ip` headers on the server.
- device: `device_id` (stable UUID in localStorage) and `fingerprint` (light hash of UA + screen + tz).
- page: full URL, path, search, referrer, title.
- env: language, timezone, viewport, screen.
- timing: `started_at` (insert default), `ended_at` (set on end event).

API
- Route: `POST /api/analytics/page-view`.
  - Start: `{ action: "start", ... }` → `{ id }`.
  - End: `{ action: "end", id }` → `{ ok: true }`.
  - End uses `sendBeacon`/`keepalive` for unload safety.

Setup
- Env: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set server-side.
- Deploy: Apply migrations (e.g., `supabase db push` or CI migration step).

Notes
- No RLS policies required because writes use the service role via the API route.
- Queries can compute duration as `extract(epoch from (ended_at - started_at)) * 1000`.

