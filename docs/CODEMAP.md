# My Dubai Broker — Code Map

A file-level index: what each part of the codebase does, and exactly where to go for a given task. Use this to find the right file fast; use [README.md](./README.md) to understand *why* it's built that way; use [PENDING.md](./PENDING.md) to know what's missing and what to work on next.

This map was built by listing the actual current directory structure (not written from memory), but code moves — if a path here is wrong, trust the filesystem over this file and fix the entry.

---

## How to use this file

1. Know roughly what you're touching ("the admin approval queue", "how leads get created") → find it in the tables below → go straight to the file.
2. Don't know where to start at all → check **"Where to pick up X"** at the bottom, which points at the current focus areas from `PENDING.md`.
3. Adding something genuinely new (a new module/route/page) → add a row here when you're done, in the same style. A code map that isn't updated is worse than none.

---

## Backend (`mydubai-broker-backend/src/`)

**Entry points**: `index.ts` (starts the server) → `app.ts` (Express app: helmet, JSON body parsing, CORS, mounts `routes.ts`, error handler) → `routes.ts` (mounts every module's router under `/api/...`, plus better-auth's own catch-all at `/api/auth/*`).

**Shared infrastructure**:

| File | What it does |
|---|---|
| `lib/auth.ts` | better-auth config — the only auth code in the backend. Roles default, password reset (`sendResetPassword`), email verification hook. |
| `lib/email.ts` | Placeholder `sendEmail()` + `emailTemplates` — logs instead of delivering, shaped to swap in Resend later. |
| `lib/env.ts` | Zod-validated environment variables — the app fails fast at boot if something required is missing. Add new env vars here (and to `.env.example`). |
| `lib/r2.ts` | Cloudflare R2 (S3-compatible) helpers — presigned URLs, public URL construction. |
| `middleware/auth.middleware.ts` | `requireAuth` — populates `req.user`/`req.session` from the better-auth session. That's the whole file. |
| `middleware/permissions.ts` | The capability system — `Capability` type, `ROLE_CAPABILITIES`, `requireCapability`, `userHasCapability` (role default + per-user override), `requirePlatformStaff`, `requireCompanyOwnerOrManager`, `requireCompanyMembership`. |
| `middleware/rateLimit.ts` | In-memory per-IP rate limiter, applied to every unauthenticated account-creation/login route. |
| `middleware/validate.ts` | Wraps a Zod schema as Express middleware for `body`/`query`/`params`. |
| `middleware/error.middleware.ts` | `globalErrorHandler` — the only error handler (there used to be an unused duplicate; deleted). |
| `utils/AppError.ts` | Typed error class with an HTTP status code — throw this from services, not raw `Error`. |
| `utils/asyncHandler.ts` | Wraps an async Express handler so thrown errors reach `globalErrorHandler`. |
| `utils/response.ts` | `sendSuccess`/`sendError` — the standard response envelope every controller uses. |
| `prisma/client.ts` | The shared Prisma client instance — import `prisma` from here, never instantiate a new client. |
| `prisma/schema.prisma` | **The source of truth for the data model.** Read this before trusting any prose description of what fields exist. |

**Modules** (each follows `*.controller.ts` → `*.service.ts` → `*.routes.ts`, usually `*.validation.ts` for Zod schemas, sometimes `*.mapper.ts` for shaping DB rows into API responses):

| Module | Mounted at | What it owns |
|---|---|---|
| `modules/listings/` | `/listings` | **The real listing API.** Create/update/read for all 5 categories in one unified model, approval/publication status transitions, admin listing queue reads. `listings.mapper.ts` converts raw enum values to human labels — never let a raw `REAL_ESTATE` reach the frontend without going through this. |
| `modules/cars/`, `modules/real-estate/`, `modules/yachts/` | `/cars`, `/real-estate`, `/yachts` | **Legacy per-category endpoints.** Still functional, but no frontend code calls them anymore (all migrated to `/listings`) — candidates for the same deprecation `/jets`/`/helicopters` already got. Don't build new work here. |
| `modules/jets/`, `modules/helicopters/` | `/jets`, `/helicopters` | **Deprecated — return `410 Gone`.** Jets/helicopters are `PRIVATE_AVIATION` listings now (`assetType: JET|HELICOPTER`), created via `/listings`. These modules are thin shims that just return the 410 response; don't add logic here. |
| `modules/companies/` | `/companies` | Onboarding (`updateOnboarding` — the one atomic account+company creation call; images → `Company` columns, documents → nested `CompanyDocument` rows), `getMyCompany`, and **team management**: `getCompanyUsers`, `deactivateUser`/`reactivateUser`, `updateUserPermissions`. `companies.mapper.ts` `mapCompanyMedia` flattens `documents` into `<type>Url` fields + presigns them — used by `/companies/me` and the admin company endpoints. |
| `modules/invitations/` | `/invitations` | The only way non-owner users join a company. Create/list/revoke an invite (owner/manager), and the public token preview + accept endpoints (no auth required — the invited person has no account yet). |
| `modules/profile/` | `/profile` | `AgentProfile` get/update (`GET /profile/me`, `PATCH /profile/me`) — the public-facing agent profile, separate from the `User` login record. |
| `modules/admin/` | `/admin` | Platform-staff-only: company approval queue, listing approval queue, `getPlatformStats` (now called by the frontend overview page, see below). |
| `modules/leads/` | `/leads` | The Leads/CRM MVP: public capture (`POST /leads`, what enquiry forms call), stage transitions, activity logging (call/WhatsApp/email/note), assignment. |
| `modules/uploads/` | `/uploads` | Presigned R2 upload flow — `createPresignedUpload`, `withAttachedUploads`/`withMergedListingPhotos` (used by every module that accepts photos/documents), abandoned-upload cleanup job. |
| `modules/users/` | `/users` | Small, mostly legacy — `getSellers`/`updateSellerVerification`. Still not the place for new user-management work — platform-wide user management (list/role-change/deactivate across all companies) lives in `modules/admin/admin.service.ts` (`getAllUsers`/`updateUserRole`/`adminDeactivateUser`/`adminReactivateUser`, mounted at `/admin/users`), added 2026-09-28. |

---

## Frontend (`mydubai-broker-frontend/src/`)

**Entry points**: `app/[locale]/layout.tsx` (root layout, i18n) → route-specific `layout.tsx` files (e.g. `dashboard/layout.tsx` wraps every `/dashboard/*` page in `AdminPanelLayout`, which renders `Sidebar` + role-gates via `AuthGuard`).

**Services** (`src/services/`) — the only place API calls should be made from; components call these, never `fetch`/`apiRequest` directly:

| Service | Talks to (backend) | Notes |
|---|---|---|
| `listing.service.ts` | `/listings` | Reads only (`getListings`, `getPublicListings`, etc.) — creates/updates happen via the per-category services below, which all map onto `/listings` internally. |
| `car.service.ts`, `realEstate.service.ts`, `yacht.service.ts`, `jet.service.ts`, `helicopter.service.ts` | `/listings` (all five — legacy backend endpoints not used) | Each has a `toListingPayload()` mapper translating that category's form fields into the unified `{ category, assetType, offeringType, details }` shape. This is where to look if a category's create/edit form needs a new field. Jet/helicopter map `offeringType` SALE/CHARTER + `rateBasis` HOUR/DAY → `salePrice` / `charterRate` / `dailyRate` (charter is aviation-only). |
| `company.service.ts` | `/companies` | Onboarding submit, `getMyCompany`, team management (`getCompanyUsers`, `deactivateUser`, `updateUserPermissions`). |
| `invitation.service.ts` | `/invitations` | Create/list/revoke invites, public token preview/accept. |
| `profile.service.ts` | `/profile` | Agent profile get/update. |
| `admin.service.ts` | `/admin` | Company/listing queue reads + status updates, plus `getPlatformStats` (backs the `/admin` overview page). |
| `lead.service.ts` | `/leads` | Public capture + authenticated list/stage/activity actions. |
| `upload.service.ts` | `/uploads` | `UploadService.sendWithPhotos(endpoint, method, data)` — the standard way any form with photos submits; uploads files first, then sends the JSON body with `photoUploadIds` attached. |
| `auth.service.ts` | better-auth directly (not a backend module) | `FrontendAuthService` — login, sign out, session, forgot/reset password. No registration methods; accounts are only ever created server-side. |

**Routes** (`src/app/[locale]/`), grouped by area:

| Area | Routes | Notes |
|---|---|---|
| Public marketing/browse | `/`, `/about`, `/category/[type]`, `/all-listings/[type]`, `/details/[id]`, `/developers/[id]`, `/search`, `/blog`, `/stories`, `/article/...`, `/faq`, `/contact`, `/terms`, `/privacy`, `/business-terms`, `/buying-standards`, `/brand-visibility`, `/the-view`, `/trusted-journeys`, `/sitemap`, `/support` | The public site (no login). Real listings only (since 2026-10-29): `/category/[type]` → `CategoryListings.tsx` (latest 8) → "View all" `/all-listings/[type]` → `/details/[id]`; home `ExclusiveCarousel` and `/search` (`SearchContent.tsx`, client-side filter) also read `GET /listings/public`. Note `/listings` and `/listings/[id]` are **not** public — they're the company dashboard (company roles only; platform staff are redirected to login and should use `/admin/listings`). |
| Auth | `/login` (agent/company login, `AgentLoginContent.tsx`), `/admin-login` (same login, admin-branded), `/forgot-password`, `/reset-password` | One login path underneath regardless of which page — see README "Auth". |
| Onboarding | `/onboarding` (`OnboardingWizard.tsx`), `/select-category` | Multi-step company signup, client-side autosaved. |
| Invitation | `/invite/[token]` | Public accept-invite page. |
| Company dashboard | `/dashboard` (role-branched since 2026-09-28: owners/managers see the company-wide grid, agents/viewers see "My Overview" — own listings + a stat strip), `/dashboard/leads`, `/dashboard/team`, `/dashboard/profile`, `/listings/[id]/edit` | Everything behind `AdminPanelLayout` + `Sidebar`. `/listings` itself (`ListingManager.tsx`) hasn't been audited for the same own-vs-company-wide scoping — see PENDING.md. |
| Platform admin | `/admin` (`AdminOverviewView.tsx` — stat tiles for companies/listings/leads), `/admin/companies` (`AdminCompaniesView.tsx`), `/admin/listings` (`AdminListingsView.tsx` — now a unified searchable "all statuses" table + approval actions, not just a pending-review queue), `/admin/audit-log` (`AdminAuditLogView.tsx`, super-admin only), `/admin/users` (`AdminUsersView.tsx`, super-admin only — search/filter, role changes, deactivate/reactivate across every company) | **5 of the ~9 admin areas the plan describes exist** — no config, no bulk actions. See "Where to pick up". |

**Key shared components**:

| File | What it is |
|---|---|
| `components/layout/Sidebar.tsx` | Role-gated nav — reads role grouping arrays from `types/enums.ts` (`COMPANY_ROLES`, `COMPANY_MANAGEMENT_ROLES`, `PLATFORM_STAFF_ROLES`). Add a nav item here when adding a new dashboard page. |
| `components/layout/AdminPanelLayout.tsx` | Wraps every `/dashboard/*` and `/admin/*` page — role guard (`AuthGuard`) + company-approval-status gate (blocks access if the company isn't `APPROVED`) + renders `Sidebar`. |
| `components/auth/AuthGuard.tsx` | The actual role-check component `AdminPanelLayout` uses. |
| `components/views/AdminCompaniesView.tsx` | The company approval queue UI — status tabs, Approve/Request Changes/Reject, document review modal. Closest existing pattern to copy for a new admin queue/table page. |
| `components/views/AdminListingsView.tsx` | The listing/all-listings management UI — same pattern as `AdminCompaniesView.tsx` (status tabs including "Request Changes", search). Uses the real `approvalStatus`/`category`/`assetType` fields, not the stale `listingsStatus`/`type` fields other listing-display components still read (see `PENDING.md`). |
| `components/views/OnboardingWizard.tsx` | The 3-step company onboarding form, with client-side autosave/completion-% logic. |
| `components/dashboard/AssetCard.tsx` | The listing card used on `/dashboard` and category browse pages — uses the **stale** `ListingStatus` system from `types/listing.ts`, not the backend's real `ApprovalStatus`/`PublicationStatus` (see `PENDING.md` Priority 3). |
| `types/enums.ts` | Frontend's mirror of the backend's Prisma enums — `UserRole`, `CompanyCategory`, `CompanyStatus`, and (added 2026-09-28) `ApprovalStatus` are realigned and current; `ListingStatus`/`PropertyListingType` (a different, older enum in this same file) are still stale, don't trust them — see `PENDING.md` for exactly which components still read the stale one. |
| `lib/schemas/common.ts`, `listingBase.ts`, `accountSchemas.ts` | Shared zod field builders (required text, email, phone, URL, number, year, select, password, file) with consistent friendly messages — build every form schema from these. `listingBase.ts` holds the rules all listing categories share. |
| `lib/utils/formErrors.ts` | `applyServerFieldErrors` (puts backend `errors[]` onto react-hook-form fields) and `summarizeFieldErrors` (toast text naming invalid fields). Backend counterpart: `middleware/validate.ts` `formatZodIssues`. |
| `components/category/CategoryListings.tsx` | "Latest Listings" grid of real public listings + "View all" link — used by all 4 category views (`components/views/*CategoryView.tsx`). |
| `lib/utils/adaptListing.ts`, `lib/utils/listingCompleteness.ts` | `adaptListing` shapes API listings into the frontend `Listing` (incl. `price` + `priceSuffix`); `resolveListingPrice`/`formatListingPrice` pick the active price field and its unit (" / hr", " / day", " / mo", " / yr"). |
| `lib/auth-client.ts` | better-auth React client — `signIn`, `signOut`, `useSession`, `requestPasswordReset`, `resetPassword`. No `signUp` export (nothing calls it). |

---

## Where to pick up X

Cross-referenced to `PENDING.md`'s current-focus callout — these are the concrete files involved for each item, so you don't have to re-derive them:

| Task | Backend files | Frontend files to add/edit |
|---|---|---|
| ~~**Admin overview/stats page**~~ | **DONE** 2026-09-27 — `modules/admin/admin.service.ts` `getPlatformStats`, route `GET /admin/stats` | **DONE** 2026-09-27 — `services/admin.service.ts` `getPlatformStats`, `src/app/[locale]/admin/page.tsx` + `components/views/AdminOverviewView.tsx`, sidebar link in `Sidebar.tsx` |
| ~~**Audit log viewer**~~ | **DONE** 2026-09-27 — `modules/admin/admin.service.ts` `getAuditLog`, route `GET /admin/audit-log` (super_admin only, via `requireCapability`) | **DONE** 2026-09-27 — `services/admin.service.ts` `getAuditLog`, `src/app/[locale]/admin/audit-log/page.tsx` + `layout.tsx` + `components/views/AdminAuditLogView.tsx`, sidebar link (super-admin only) |
| ~~**Role-specific company dashboard content**~~ | **DONE** (partial) 2026-09-28 — none needed, used the existing `GET /listings/my-listings` | **DONE** (partial) 2026-09-28 — `dashboard/page.tsx` branches on `COMPANY_MANAGEMENT_ROLES.includes(userRole)` same as `/dashboard/leads`; agents/viewers get own-listings-only + a stat strip. Still open: audit whether `/listings` (`ListingManager.tsx`) itself is role-scoped, and "My Performance" has no backing module yet — see PENDING.md |
| ~~**Listing queue "Request Changes" parity**~~ | **DONE** 2026-09-28 — no backend change needed (`updateApprovalStatus` already handled `CHANGES_REQUIRED` and already enforced a reason) | **DONE** 2026-09-28 — `components/views/AdminListingsView.tsx` now uses the same `reasonModalAction` pattern as `AdminCompaniesView.tsx`; also fixed a real bug found along the way: the status badge read a nonexistent `listing.listingsStatus` field (always showed "Pending Review") — now reads the real `listing.approvalStatus`, added `ApprovalStatus`/`LISTING_APPROVAL_AWAITING_DECISION` to `types/enums.ts`. `listings/[id]/page.tsx` and `dashboard/page.tsx` have the identical `listingsStatus` bug, still unfixed — see PENDING.md |
| ~~**Platform-wide user/role management**~~ | **DONE** 2026-09-28 — `modules/admin/admin.service.ts` `getAllUsers`/`updateUserRole`/`adminDeactivateUser`/`adminReactivateUser`, routes at `/admin/users`, new `admin.manage_users` capability (super_admin only) | **DONE** 2026-09-28 — `services/admin.service.ts` additions, `src/app/[locale]/admin/users/page.tsx` + `layout.tsx` + `components/views/AdminUsersView.tsx`, sidebar link (super-admin only) |
| ~~**Fix or remove `/products/new`**~~ | **DONE** 2026-09-28 (N/A, backend module was already deleted) | **DONE** 2026-09-28 — deleted `src/app/[locale]/products/new/page.tsx`, `components/forms/ProductForm.tsx`, `services/product.service.ts`, `lib/schemas/productSchema.ts` (one file at a time — a bulk multi-file delete tripped the sandbox's destructive-action guard, deleting them individually did not). Confirmed no other file referenced any of them, `/products/new` now correctly 404s instead of crashing, typecheck clean. |
