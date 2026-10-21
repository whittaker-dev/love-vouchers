# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small gift app: the boyfriend (admin, email+password login) creates "love vouchers"; the girlfriend logs in to her page (one account, created by the admin), multi-selects vouchers, adds a note and sends a "wish" (limited per month); each wish becomes a notification on the admin's "Thông báo" page, where handling a voucher deletes it. Her page also has a daily scratch card with a greeting and occasion themes (holidays, her birthday, the anniversary). There is no email. All UI copy is Vietnamese (anh/em voice). Mobile-first. README.md (Vietnamese) has the full run guide; design.md is the design system and is normative for UI work.

## Commands

Run from the repo root (pnpm 10 workspaces, Node 24):

```bash
pnpm install
pnpm infra:up          # Postgres on localhost:5433
pnpm db:migrate        # prisma migrate dev && prisma generate
pnpm db:seed           # syncs the single admin to ADMIN_* in .env, then the one-time boot setup (rarely needed: the API runs it on start)
pnpm dev               # shared (tsc --watch) + api (tsx watch :4000) + web (vite :5173)
pnpm typecheck         # builds shared first, then tsc --noEmit everywhere
pnpm build             # production build of all three packages
docker build -t love-vouchers .   # production image (one service: API + built web), as deployed on Render
```

Single package: `pnpm --filter @love/api <script>` / `pnpm --filter @love/web <script>`. There are **no tests and no linter**; `pnpm typecheck` and `pnpm build` are the checks.

There is exactly **one** env file: `.env` at the repo root (template `.env.example`), loaded by `apps/api/src/config.ts` and `apps/api/prisma7.config.ts` via `process.loadEnvFile`, which never overrides real environment variables (so Render's dashboard values, or `DATABASE_URL=... pnpm db:seed`, win). `src/config.ts` validates everything with zod and exits at boot on bad config (e.g. `JWT_SECRET` < 32 chars).

## Architecture

- `packages/shared`: zod input schemas (with Vietnamese error messages) + response DTO types. Both apps import `@love/shared`, which resolves to **built** `dist/`. After editing shared, rebuild it (`pnpm dev` watches it; otherwise `pnpm --filter @love/shared build`) or the other apps see stale types.
- `apps/api`: Express 5 (async errors propagate natively). Two roles with separate httpOnly JWT cookies (`auth.ts`): admin `lv_session`, her `lv_user`; the role is signed into the token, so one cookie cannot stand in for the other. `routes/her.ts` is her side, mounted at `/api` behind `requireViewer` (her, or the admin previewing); only `POST /wishes` requires her specifically (`requireUser`, which also checks the account still exists, so deleting it ends her session). `routes/auth.ts` has both logins; `routes/admin.ts` is all `requireAdmin`. Throw `HttpError(status, viMessage)`; `errors.ts` turns ZodError into `{ error, fields }`. `serializers.ts` is the only DB→DTO mapping. `index.ts` awaits `runFirstBootSetup()` (`bootstrap.ts`) before listening: creates the admin from `ADMIN_*` only if none exists, the settings and profile only if missing, and the starter vouchers and starter occasions (`starterData.ts`) exactly once per database, guarded by a `SetupStep` row inserted in the same transaction (safe across restarts, redeploys and concurrent boots; tested). When `WEB_DIST_DIR` is set (the Dockerfile sets it), `app.ts` also serves the built web app with an SPA fallback. There are no file uploads; avatars and voucher icons are emoji.
- `apps/web`: React 19 + Vite. All server state goes through hooks in `src/api/hooks.ts` (query keys defined once there). Vite proxies `/api` to :4000, so web and API are same-origin in dev (no CORS, cookie just works), matching production where one Express process serves both.
- Data model: `WishRequest` (one send = one notification) has many `Redemption` (one per voucher). Rows exist **only while pending**: done/cancel delete them (`notifications.ts`), and the wish goes with its last item. Usage therefore lives in `Voucher.usedCount`: incremented on send with a conditional `updateMany` (`usedCount < quantity` via a field reference, so concurrent sends cannot overbook), decremented on cancel, untouched on done. Remaining = `quantity − usedCount`. Redemptions snapshot voucher title/emoji. Date-only fields are `@db.Date` and travel as `"YYYY-MM-DD"` strings; expiry is evaluated in Vietnam time (`dates.ts`).
- Her account: at most **one** `User` row, created/deleted by the admin at `/admin/account` (`POST /admin/user` returns 409 if one exists; to change it, delete and recreate). It is never seeded from env; a fresh deploy has no login for her until the admin creates one.
- Monthly limit (`quota.ts`): `AppSetting.monthlyWishLimit` (default 3, admin-editable) against `MonthlyUsage` keyed by Vietnam-time month `"YYYY-MM"`. `consumeMonthlySend(tx)` is a conditional increment inside the same transaction as the voucher increments, so a blocked send charges nothing.
- Occasions (`occasions.ts`): `birthday` / `anniversary` take their date from the profile; other kinds store day/month, solar or lunar. Lunar dates convert via `lunar.ts` (Hồ Ngọc Đức algorithm, UTC+7). An occasion is active from `daysBefore` to `daysAfter` around its date; birthday beats anniversary beats the rest. `{name}` in the message becomes her nickname. Admin previews any occasion with `/?preview=<id>`. Themes are a shared enum; how each looks lives only in `apps/web/src/lib/occasionThemes.ts`.
- Greetings (`greetings.ts`): one fixed seeded shuffle of the list, indexed by days since 2024-01-01 (Vietnam time), so a greeting repeats exactly `GREETING_COUNT` days later. Adding greetings changes the order; reshuffling per cycle would allow near repeats, so don't.
- Deploy target: Render free (`render.yaml`, root `Dockerfile`, Singapore) + Supabase Postgres via the **session pooler** URL with `?uselibpqcompat=true&sslmode=require`. The container runs `prisma migrate deploy` and then the first-boot setup on every start, so a fresh database needs no manual steps.

## Gotchas

- **Prisma 7**: config is `apps/api/prisma7.config.ts` (that exact filename is looked up first), which loads `.env` itself. The client is generated into `apps/api/src/generated/prisma` (gitignored) with `.js` import specifiers; import from `./generated/prisma/client.js`. `migrate dev` no longer runs `generate`; the package scripts chain it. `prisma generate` needs `DATABASE_URL` set (the Dockerfile sets a placeholder). Prisma refuses `migrate reset` from an AI agent without the user's explicit consent.
- **Fixed-position UI must portal to `document.body`**: the page-transition wrapper (`AnimatedOutlet`) animates `filter`, which makes it the containing block for `position: fixed` descendants (see `SelectionBar`, `SuccessOverlay`, `ScrollProgress`).
- Her page routes are wrapped in `RequireViewer`, which redirects to `/dang-nhap` when `useViewer()` is `null`. `useViewer` / `useMe` turn a 401 into `null` (`orNullWhenLoggedOut` in `hooks.ts`) so "logged out" is data, not an error state.
- Date inputs use `DatePicker` / `DayMonthPicker`, never native `<input type="date">`.
- `useInView` attaches once at mount: put the ref on an element that always renders, not one that appears after data loads.
- Public-page entrance animations wait for `useIntroDone()` (the IntroLoader overlay); otherwise they play hidden behind it.
- Scroll-linked values bypass `MotionConfig reducedMotion`; use `useParallax()` from `src/lib/parallax.ts`.
- `global.css` must be imported first in `main.tsx`, before any CSS module, or `.container`'s padding overrides page paddings.
- Fonts must have a Vietnamese subset (Be Vietnam Pro is the only family). Inputs are 16px on phones to stop iOS zoom.

## Conventions

- Every user action must have an animation (design.md §6). Use tokens from `src/styles/tokens.css` and `src/lib/motion.ts`; no hard-coded colours/easings in components.
- Check new UI at 390px width; phones get the bottom tab bar and horizontal voucher cards (≤560px).
- Code and comments in English; user-facing strings in Vietnamese.
- Dependencies are pinned to exact versions.
