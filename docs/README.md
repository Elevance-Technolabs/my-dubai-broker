# My Dubai Broker (MDB)

A multi-category luxury asset marketplace and broker back-office: real estate, cars, yachts, private aviation (jets/helicopters), and collectibles. Brokerages/dealers ("companies") onboard, get verified by platform admins, and their agents create listings that go through an approval workflow before going live to the public.

This is a two-repo pnpm workspace:

```
MDB/
├── mydubai-broker-backend/    Express + TypeScript + Prisma + PostgreSQL API
├── mydubai-broker-frontend/   Next.js (App Router) + TypeScript frontend
├── CODEMAP.md                 File-level index: what each file does, where to pick up a given task
├── PENDING.md                 Gap analysis: plan vs. current code, prioritized — READ THIS before starting new work
└── README.md                  This file
```

Each subfolder is its own git repository with its own remote. The root `package.json` only wires up `pnpm dev` (runs both in parallel) and `pnpm db:generate`.

**If you're an AI agent picking up work here**: read [PENDING.md](./PENDING.md) first — it's a file-path-referenced audit of what's implemented, partial, or missing against the product plan, kept up to date as work lands. **Current focus: the admin/company dashboards, until they're streamlined** — see the callout at the top of `PENDING.md`. Then use [CODEMAP.md](./CODEMAP.md) to find the exact files involved in whatever you're picking up — it has a "Where to pick up X" table cross-referenced to that same focus area.

---

## Quick start

```bash
pnpm install                      # from repo root, installs both packages
cp mydubai-broker-backend/.env.example mydubai-broker-backend/.env
cp mydubai-broker-frontend/.env.example mydubai-broker-frontend/.env
# fill in .env values — see "Environment variables" below
pnpm --filter mydubai-broker-backend exec prisma generate
pnpm --filter mydubai-broker-backend exec prisma db push   # or migrate, once migrations exist
pnpm dev                          # runs backend + frontend together
```

Backend defaults to whatever `PORT` is set to in its `.env`; frontend (Next.js) defaults to `:3000` and expects the backend at `NEXT_PUBLIC_API_URL` (see frontend `.env.example`, default `http://localhost:3001/api`).

### Environment variables

**Backend** (`mydubai-broker-backend/.env`, validated at boot by `src/lib/env.ts` — the app fails fast if required vars are missing):
- `PORT`, `NODE_ENV`, `DATABASE_URL` (PostgreSQL)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — auth session signing (see [Auth](#auth))
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — Cloudflare R2 for photo/document storage (see [Uploads](#uploads--media))
- `CORS_ORIGINS` — comma-separated origins allowed to call the API
- `FRONTEND_URL` (optional, defaults to `http://localhost:3000`) — used to build links inside outgoing emails
- `EMAIL_FROM` (optional, has a placeholder default) — unused until a real email provider is wired in, see [Email](#email)
- `EMAIL_VERIFICATION` (optional, defaults `false`) — whether better-auth requires a verified email before sign-in works. Leave it `false` unless you also build a verify-email UI (see [Auth](#auth)) — there isn't one yet.
- Google OAuth is currently commented out in `src/lib/auth.ts`/`auth-client.ts` — not required yet. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` were removed from `.env.example` since nothing reads them; re-add if OAuth is ever wired back up.

**Frontend** (`mydubai-broker-frontend/.env`):
- `NEXT_PUBLIC_BETTER_AUTH_URL` — must match the backend's auth URL
- `NEXT_PUBLIC_API_URL` — backend API base URL

No real email provider is configured yet — outgoing email goes through a placeholder that only logs, see [Email](#email).

---

## Architecture

### The core data model

Everything revolves around one `Listing` table plus a category-specific "details" sub-table, not five separate listing tables. This is deliberate — see `prisma/schema.prisma` in the backend for the source of truth, but the shape is:

```
Listing (category, assetType, offeringType, pricing, location, media, status...)
  ├─ RealEstateListing    (1:1, when category = REAL_ESTATE)
  ├─ CarListing           (1:1, when category = CARS)
  ├─ YachtListing         (1:1, when category = YACHTS)
  ├─ PrivateAviationListing (1:1, when category = PRIVATE_AVIATION — covers both jets AND helicopters)
  └─ CollectibleListing   (1:1, when category = COLLECTIBLES)
```

Three-layer classification, **all stored on the base `Listing` row**:
- `category` — one of `REAL_ESTATE | CARS | YACHTS | PRIVATE_AVIATION | COLLECTIBLES`
- `assetType` — narrower type within a category, e.g. `VILLA`, `SEDAN`, `MOTOR_YACHT`, `JET`, `HELICOPTER`, `WATCH`. **Jets and helicopters are asset types under `PRIVATE_AVIATION`, not separate categories** — this trips people up, it used to be modeled as separate `JETS`/`HELICOPTERS` categories in an earlier version. The frontend's `src/types/enums.ts` `CompanyCategory` was realigned to match (`PRIVATE_AVIATION`, not `JETS_HELICOPTERS`); its `ListingStatus`/`PropertyListingType` constants are still stale, see `PENDING.md`.
- `offeringType` — the commercial purpose: `SALE | LONG_TERM_RENT | SHORT_TERM_RENT | OFF_PLAN | CHARTER | PRICE_ON_REQUEST`

Status is **dual-track and deliberately kept separate** — don't collapse these into one status field:
- `approvalStatus`: `DRAFT → SUBMITTED → PENDING_REVIEW → CHANGES_REQUIRED / APPROVED / REJECTED` — controlled by platform reviewers
- `publicationStatus`: `UNPUBLISHED → SCHEDULED → LIVE → PAUSED → EXPIRED → ARCHIVED` — controlled by the company/system (a listing is auto-published to `LIVE` when approved, but can independently be `PAUSED` without losing approval)

Pricing is flexible per offering type — `salePrice`, `annualRent`, `monthlyRent`, `dailyRate`, `charterRate` are all optional fields on one row; which ones are populated depends on `offeringType`. Currency is per-listing (`Currency` enum), never hardcoded.

### Two listing APIs (this matters)

The backend has **two** ways to create/manage listings right now, and this is the single most important thing for an agent to understand before touching listing code:

1. **Unified `/listings` API** (`mydubai-broker-backend/src/modules/listings/`) — the current, intended architecture, and as of 2026-09-27 **the only one the frontend actually calls**. One `POST /listings` endpoint takes `{ category, assetType, offeringType, ...core fields, details: {...category-specific fields} }` and creates the base `Listing` plus the right sub-table row in one transaction (`listings.service.ts` `createListing`/`attachCategoryDetails`). `PUT /listings/:id` does the same for edits. This is where new work should go.
2. **Legacy per-category endpoints** (`/cars`, `/real-estate`, `/yachts`) — older, pre-refactor REST modules that talk to the same Prisma tables directly with their own request/response shapes. Still mounted and functional on the backend, but **no longer called by any frontend code** — `car.service.ts`/`realEstate.service.ts`/`yacht.service.ts` were migrated to the unified API on 2026-09-27, the same way `jet.service.ts`/`helicopter.service.ts` were migrated earlier (whose backend routes, `/jets` and `/helicopters`, were taken a step further and fully deprecated — they now return `410 Gone`). `/cars`, `/real-estate`, `/yachts` are candidates for the same full deprecation now that nothing depends on them, but that's a deliberate follow-up decision, not done yet (kept live as a rollback safety net immediately after the migration).

**Offering types & pricing**: a listing has one active price field matching its `offeringType` (`salePrice`, `annualRent`, `monthlyRent`, `dailyRate`, `charterRate`); `updateListing` clears the others whenever a price is supplied. Only **jets and helicopters** expose a charter option in the UI (SALE or CHARTER, priced per hour → `charterRate` or per day → `dailyRate`). Frontend display goes through `resolveListingPrice` (`lib/utils/listingCompleteness.ts`) / `Listing.priceSuffix` (`adaptListing.ts`) for the "/ hr", "/ day" suffixes.

**Public pages show real data only**: `/category/[type]`, `/all-listings/[type]`, `/details/[id]`, `/search` and the home carousel read approved+live listings from `GET /listings/public` (category filter only, no text search). Don't reintroduce hardcoded sample listings — `src/data/category-data.ts` is for editorial content only.

Each category service's `toListingPayload()` mapper (frontend) has a comment where the old per-category form fields don't map cleanly onto the unified schema — most notably real estate's `status` field, which is really a leftover offering-type-ish value (`SALE/RENT/OFF_PLAN/NEW/PRE_OWNED`) that only partially covers the backend's real `OfferingType` enum; see `realEstate.service.ts` and `PENDING.md` Priority 3.

### Roles & permissions

Seven roles (`prisma/schema.prisma` `UserRole` enum): `super_admin, platform_reviewer, company_owner, company_manager, agent, listing_coordinator, viewer`.

Backend enforcement lives in `src/middleware/permissions.ts` — a `Capability` string union (e.g. `"listings.create_draft"`, `"admin.approve_companies"`) mapped per role in `ROLE_CAPABILITIES`. `requireCapability(capability)` middleware checks this via `userHasCapability(userId, role, capability)`, which layers a **per-user override** on top of the role default: it reads `User.permissions Json?` (e.g. `{ "listings.submit_to_platform": true }`) and, if that capability has an explicit `true`/`false` there, that wins outright; otherwise it falls back to the role default. This always re-reads from the DB (not session data), so a permission change or a deactivation takes effect on the very next request. This is the pattern to follow for any new route that needs role gating — don't invent a new authorization mechanism, and don't bypass `userHasCapability` by checking `role` directly if per-user overrides should apply.

The frontend's `src/types/enums.ts` `UserRole` matches the full 7-role set, along with grouping arrays `COMPANY_ROLES`/`COMPANY_MANAGEMENT_ROLES`/`PLATFORM_STAFF_ROLES` used by `Sidebar.tsx` and the route-level layout guards (`dashboard/layout.tsx` etc.) instead of hardcoded role strings. What's still open: the sidebar/dashboard don't yet render different *content* per company role (agent vs. viewer see the same generic dashboard today, just gated the same way) — see `PENDING.md`.

**Team creation**: owners/managers invite teammates by email + role — this is the *only* way agents/managers/coordinators/viewers join a company now. Backend: `src/modules/invitations/` (`POST /invitations` to send, `GET /invitations/token/:token` + `POST /invitations/token/:token/accept` for the invited person, no account required until they accept, no email/OTP verification required either — see Auth below). Frontend: `/dashboard/team` (send/list/revoke, owner+manager only) and the public `/invite/[token]` acceptance page. The invite form can set `permissions: { "listings.submit_to_platform": true }` on send (a checkbox, shown only when inviting an `AGENT`) — the one per-user override the plan specifically calls for. (There used to be a separate public self-registration path for agents that created accounts with no company attached — removed in the 2026-09-27 auth cleanup rather than reconciled with the invite flow, see `PENDING.md`.)

**Deactivation**: `companies.service.ts` `deactivateUser`/`reactivateUser` (routes under `/companies/me/users/:userId/...`, `team.deactivate_users` capability — owner-only per the existing matrix, not manager) call better-auth's `auth.api.banUser`/`unbanUser`, which revokes access immediately. Deactivating reassigns that user's still-open leads (`stage NOT IN (WON, LOST)`) to the company owner; **listings are deliberately left alone** — the plan is explicit that the company owns business records and the user account only controls access, so a deactivated agent's listings keep their original `creatorId`. Frontend: the "Active Members" section on `/dashboard/team` (owner-only).

**Agent profile vs. login account**: the plan calls these out as separate records, and the schema already modeled it (`AgentProfile`, 1:1 with `User`) — but nothing referenced it until now. `src/modules/profile/` (`GET/PATCH /profile/me`) does get/upsert on the caller's own profile: display name, bio, photo, phone/WhatsApp/email each with a public-visibility toggle, languages. Frontend: `/dashboard/profile`. Not done: per-category credentials (`specialities`/`credentials Json?` fields exist on the model, no UI collects them yet), and public-facing pages still read the raw `User` record instead of `AgentProfile`.

### Auth

[better-auth](https://better-auth.com) (`mydubai-broker-backend/src/lib/auth.ts`), with a Prisma adapter — and, as of a 2026-09-27 cleanup pass, **the only auth code in the backend**. `requireAuth` middleware (`src/middleware/auth.middleware.ts`) populates `req.user`/`req.session` from the better-auth session; that's the entire file now. There used to be a custom `src/modules/auth/` wrapping better-auth's routes (`/auth/register`, `/auth/login`, etc.) plus separate company/agent registration controllers — all deleted after tracing every call site and confirming the frontend never called any of them (it talks to better-auth's client directly, or to `/companies/onboarding` / `/invitations` for account creation). Don't recreate a wrapper around better-auth's routes; call `authClient` (frontend) or `auth.api` (backend) directly, matching every real path in the codebase.

**Cross-site sessions (bearer token)**: in production the frontend and backend are on different sites, so the session cookie can't be relied on. better-auth's `bearer()` plugin is enabled; the frontend stores the `set-auth-token` header from sign-in in localStorage (`src/lib/auth-token.ts`) and sends `Authorization: Bearer` on every request — better-auth calls via `fetchOptions` in `auth-client.ts`, everything else via `core/api.ts`. Always sign out through the exported `signOut` (it clears the token). Any new code that calls the backend must go through `apiRequest` or it won't be authenticated in production.

**Two ways to create an account**: company onboarding (`/companies/onboarding`, creates the owner) or accepting an invitation (`/invitations/token/:token/accept`). Both call `auth.api.signUpEmail` server-side and then explicitly set `role`/`companyId` — there's no client-side self-registration for any role. (There used to be a third, self-service "Become a Partner" agent registration path; it created accounts with no company attached — a dead end in this company-scoped system — and was removed rather than fixed, since the invite flow already covers this properly.)

**Password reset** works end-to-end: better-auth's native `sendResetPassword` (configured in `auth.ts`) routes through the placeholder email service (see "Email" below), with `requestPasswordReset`/`resetPassword` client actions and `/forgot-password`/`/reset-password` pages on the frontend.

Email verification (and OTP) is genuinely not implemented — `sendVerificationEmail` in `auth.ts` sends through the placeholder email service now (not a bare `console.log` anymore), but `requireEmailVerification` defaults `false` and nothing in the app requires it. This is by design: the invitation flow doesn't require email/OTP verification to accept an invite. If that flag is ever flipped on, note there's currently no frontend UI for the verify-email step.

**If you're seeding a fresh database**, note the super-admin/platform-reviewer accounts are hashed with `hashPassword` from `src/lib/password.ts` (`prisma/seed.ts`) — the same custom scrypt (`r=8`) hasher `auth.ts` verifies with. Any hash made another way (better-auth's default `r=16`, bcrypt) will silently fail to log in. If a seeded login fails, check this first — and check the backend is running from the `main` branch: the stale `prod` branch still uses better-auth's default hasher and can't verify any password in a `main` database (see `PENDING.md` 2026-10-29).

### Email

`src/lib/email.ts` — a placeholder `sendEmail()` / `emailTemplates` module. **It does not deliver anything**; it logs a formatted message to the console (clearly marked `[email:placeholder]`) instead of calling a real provider. It exists so every call site already goes through one interface shaped like Resend's SDK (`{ to, subject, html }`), so wiring in the real thing later — the plan specifies Resend — is a one-file change (the docstring at the top of `email.ts` shows exactly what to replace). Currently sent through this path: invitation emails, company status-change emails, listing status-change emails, and new-lead-received emails — i.e., everywhere the app already creates an in-app `Notification`, it now also calls `sendEmail` alongside it. `FRONTEND_URL` and `EMAIL_FROM` env vars exist for this (both optional, dev defaults) but are unused until a real provider needs them.

### Uploads & media

Cloudflare R2 (S3-compatible), via presigned URLs — the client asks the backend for a presigned PUT URL (`POST /uploads/presign`), uploads the file directly to R2, then references the returned `uploadId` when creating/updating a listing (`photoUploadIds: string[]`). Backend helpers: `src/modules/uploads/uploads.service.ts` — `withAttachedUploads` (create flow) and `withMergedListingPhotos` (update flow, merges kept existing photos with newly uploaded ones). Frontend: `src/services/upload.service.ts` — `UploadService.sendWithPhotos(endpoint, method, data)` is the standard way any listing form submits (uploads photos first, then sends the JSON body with `photoUploadIds` attached).

### Company onboarding

Multi-step conceptually (`CompanyOnboardingStep` enum: `SELECT_CATEGORIES → UPLOAD_DOCUMENTS → COMPANY_PROFILE → SUBMITTED → COMPLETED`), but the backend implementation (`companies.service.ts` `updateOnboarding`) is still one monolithic call at the very end — account, company, and documents are all created atomically together, not saved incrementally per step. It sets `CompanyStatus.SUBMITTED` on completion and records the transition in `StatusHistory`.

**Where uploaded files are stored**: images (`companyLogo`, `coverImage`, `listingLogo`) are columns on `Company` (`<field>Url`). The 10 verification documents (trade/RERA licence, Emirates ID, passport, dealer licences, AOC, …) are **`CompanyDocument` rows**, `documentType` = snake_case field name (`emirates_id`, `aoc_operator_document`, …) — there are no `emiratesIdUrl`-style columns on `Company` (writing one throws `Unknown argument`). On read, `companies.mapper.ts` `mapCompanyMedia` flattens the latest document per type back into `<camelType>Url` and presigns it, so API consumers (e.g. `AdminCompaniesView.tsx`) still read `company.tradeLicenseUrl` etc. Any endpoint returning a company must include `documents` and go through `mapCompanyMedia`.

**Account creation isn't in the company transaction**: `auth.api.signUpEmail` commits the user on its own, then `createOnboardedCompany` runs the company/document/status-history transaction. If that throws, `updateOnboarding` deletes the new user so no company-less account is left behind. Keep that compensating delete if you restructure this flow.

Progress persistence and a completion indicator are handled **client-side** instead (`OnboardingWizard.tsx`): the JSON-safe, non-sensitive form fields (not file selections, not the password) autosave to `localStorage` on every change, restore on return with a "Welcome back" banner, and a live completion percentage renders as a progress bar. This is a deliberate simplification of what the plan's diagram implies (server-side incremental save would require deciding when the account actually gets created, since right now that only happens at the very end) — see `PENDING.md` for the reasoning and what a "real" server-side version would need.

**Not implemented**: per-document review (approve/reject/request-changes on an individual document with a reason, and routing a resubmission to the exact field) — only whole-company-level decisions exist today. Document expiry tracking (`DocumentStatus` enum, expiry dates) also isn't automated — no background job infrastructure exists in this codebase to run that check on a schedule.

### Admin review queues

`mydubai-broker-backend/src/modules/admin/` — company approval queue and listing approval queue, both with filters/pagination. Both now enforce a reason on reject/changes-required and support all three decisions (Approve / Request Changes / Reject) as distinct actions, and both create an in-app `Notification` + send an email (via the placeholder service, see "Email" above) to the affected owner/agent. Frontend: `AdminCompaniesView.tsx` / `AdminListingsView.tsx`.

### Leads / Enquiries

`mydubai-broker-backend/src/modules/leads/` (mounted at `/leads`) — an intentionally minimal first pass, not the full CRM the plan describes. `POST /leads` is public (rate-limited, no auth) and is what the site's enquiry forms call; it auto-assigns the new lead to the listing's `creatorId` (the "primary agent"), flags likely duplicates (same listing + matching email/phone) without blocking them, and notifies the assignee. Stage transitions (`NEW → CONTACTED → QUALIFIED → APPOINTMENT → NEGOTIATION → WON/LOST`) and contact logging (`CALL`/`WHATSAPP`/`EMAIL`/`NOTE`) each write a `LeadActivity`, and the first CALL/WHATSAPP/EMAIL activity auto-advances a `NEW` lead to `CONTACTED` and stamps `firstRespondedAt` for future SLA reporting. Frontend: `src/services/lead.service.ts`, `/dashboard/leads` (list + quick actions), and `InquiryForm.tsx`/`AgentSidebar.tsx` on the public listing page.

**Not built yet, on purpose** (see `PENDING.md` for the full list): SLA-based escalation to a manager (needs a background job — none exist in this codebase yet), a lead detail/activity-timeline page, `FollowUp` scheduling, manual reassignment UI (the backend endpoint exists, nothing calls it), and export. Treat this as the foundation the rest of the CRM gets built on, not the finished feature.

---

## Conventions & gotchas (read before editing)

Things that aren't obvious from the code and cost real time to rediscover:

- **Zod v4 is installed**, not v3. `z.record()` requires two arguments (`z.record(z.string(), z.any())`), not one — this differs from v3 and from a lot of example code you might generate from training data.
- **Express 5 + `noUncheckedIndexedAccess: true`** (backend `tsconfig.json`) types `req.params.id` as `string | string[] | undefined`, not plain `string`. The established pattern in this codebase is `const id = req.params.id as string;` (a plain `:id` route segment is never actually an array at runtime) — follow it rather than fighting the type system per-callsite.
- **`tsc --noEmit` from the backend root is your compile-check**, not `tsx` — the dev script (`tsx --watch`) transpiles without type-checking, so type errors can sit unnoticed through normal dev usage. Run `pnpm --filter mydubai-broker-backend exec tsc --noEmit` (or `npm run build`) before considering backend work done.
- **Backend `tsc --noEmit` is clean — zero errors, not "zero except one pre-existing issue."** An earlier version of this README noted a persistent `TS2742` "inferred type cannot be named" warning on `src/lib/auth.ts`; it turned out to be caused by a dead, do-nothing `hooks.before` block in the `betterAuth()` config, and disappeared on its own once that (and other dead auth code) was removed during the 2026-09-27 auth cleanup (see `PENDING.md`). If a similar-looking inference error reappears after touching `auth.ts`, look at what changed in the `betterAuth()` config object itself before assuming it's unrelated/pre-existing — it very much can be caused by something in there.
- **TypeScript only reports the first excess/invalid property per object literal** (`TS2353`) — if you see one Prisma `.create({ data: {...} })` field error, fix it, re-run `tsc`, and check for more in the same object before assuming it's clean. This is how the schema-migration bugs (see git log) stayed hidden — one bad field masked three others behind it.
- **`AssetType`, `CompanyCategory`, `OfferingType`, `ApprovalStatus`, `PublicationStatus` are the source of truth** — always check `prisma/schema.prisma` directly for current enum values rather than trusting a frontend constant or a comment; several frontend constants in `src/types/enums.ts` are stale (see `PENDING.md`).
- **Raw enum values must never reach the UI directly** (explicit product requirement) — the backend's `listings.mapper.ts` has label maps (`CATEGORY_LABELS`, `OFFERING_LABELS`, etc.) that convert `REAL_ESTATE` → `"Real Estate"` etc. Use/extend this pattern rather than displaying `listing.category` raw.
- **Category-specific detail fields are validated by the caller, not by Prisma's types** — `attachCategoryDetails`/`upsertCategoryDetails` in `listings.service.ts` accept a loosely-typed `Record<string, any>` and cast on the way into Prisma, because the whole point of the unified API is that each category's field set is dynamic/configurable (plan Section 10). If you're adding a new category-specific field, it likely just needs to flow through `details` — you probably don't need to touch `listings.service.ts` itself.
- **Products module was deleted** — an earlier scaffold had a generic `Product`/`ProductListing` demo unrelated to the real business (leftover from initial project bootstrap). It's gone from both the schema and `src/modules`. If you see a stale reference to it, it's dead code to remove, not something to resurrect.

---

## Known gaps

Don't take this README's description of a feature as confirmation it's fully built — **`PENDING.md` is the authoritative, current gap list** and is meant to be kept up to date as work lands; this README describes architecture and intent, not completion status. Roles/permissions and onboarding (plan Sections 3-4) are now mostly covered, with specific documented exceptions (OTP verification, per-document review, document expiry automation, role-specific dashboard content). Quality scoring, visibility/ranking, and performance analytics still have complete data models but zero service/UI code. Email exists as a placeholder (logs, doesn't deliver) rather than being fully missing. Notifications have no frontend UI (bell icon / center) despite the backend creating real `Notification` rows. See `PENDING.md` for specifics and priority order.

---

## Working conventions for this repo

- Backend and frontend are separate git repos — commit to the one you actually changed, don't assume a single commit spans both.
- Backend deploys (Render) need Build Command `pnpm install --frozen-lockfile && pnpm run build` — `build` runs `prisma generate` because `generated/prisma` is gitignored. Required env vars are listed in `PENDING.md` 2026-10-29.
- **Two lockfiles per package**: local dev resolves from the root workspace `pnpm-lock.yaml` (not in git); Render/Vercel install from each repo's own `pnpm-lock.yaml`. After any dependency change, regenerate the repo lockfile so it matches (see `PENDING.md` 2026-10-29) — otherwise production silently runs different library versions than you tested.
- Frontend deploys (Vercel) need `NEXT_PUBLIC_API_URL=https://<backend>/api` (**must end in `/api`**) and `NEXT_PUBLIC_BETTER_AUTH_URL=https://<backend>` (no `/api`), then a redeploy (`NEXT_PUBLIC_*` is baked in at build time). If `NEXT_PUBLIC_API_URL` is missing or lacks `/api`, the public pages' listing requests 404 and the pages silently show "No listings available" instead of an error.
- **R2 bucket CORS** (Cloudflare dashboard → R2 → `mdb-assets` → Settings → CORS Policy) must list every frontend origin (localhost + the Vercel domain, and any custom/preview domains) with `PUT`/`GET`/`HEAD` and header `content-type`. Browsers upload straight to R2 with the presigned URL, so a missing origin shows up as a CORS error + `403` right after `/uploads/presign` succeeds — it's not a signing problem. The app's R2 key can't read/change bucket CORS; it's dashboard-only.
- Work on `main` in both repos. The backend `prod` branch is stale and incompatible with the current DB (see `PENDING.md` 2026-10-29).
- Keep `README.md`, `CODEMAP.md`, `PENDING.md` (and `mydubai-broker-backend/docs/*`) updated **in the same change** as the code — not as a later cleanup.
- Run `tsc --noEmit` (backend) and check the frontend build before calling work done — see [Conventions & gotchas](#conventions--gotchas).
- Prefer extending the unified `/listings` API over the legacy per-category endpoints for any new listing-related backend work.
- Update `PENDING.md`'s status tags when you finish something tracked there — don't leave it stale.
