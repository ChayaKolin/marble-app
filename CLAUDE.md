# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kostone Marble ERP — a full-stack order management system for an Israeli marble/stone fabrication business. Spring Boot REST API backend + React SPA frontend, serving four roles (Consultant/Super-Admin, Hotman/Factory Manager, Installer, Customer-via-portal) through a strict 8-status order lifecycle. **The entire UI is in Hebrew (RTL)** — no English visible to end users; only DB enums and API field names are in English.

## Commands

### Local development (full stack)
```powershell
.\start-local.ps1
```
Reads/creates `.env`, starts Postgres DB if missing, launches backend (port 8080) and frontend (port 5173) in separate windows, opens the browser. Uses real PostgreSQL (not H2).

### Backend (from `backend/`)
```bash
mvn spring-boot:run              # run the API (port 8080); Flyway migrations run automatically
mvn test                         # run all tests (uses H2 in-memory, application-test.properties)
mvn test -Dtest=OrderTransitionTest                        # run a single test class
mvn test -Dtest=OrderTransitionTest#valid_transitions_are_accepted   # run a single test method
```
Alternatively run with the `local` Spring profile (`spring.profiles.active=local`) to use a file-based H2 DB instead of Postgres — see `application-local.properties`. In that mode, `StubNotificationAdapter` is used and magic links are surfaced in the UI rather than sent via email/WhatsApp.

### Frontend (from `frontend/`)
```bash
npm install
npm run dev          # Vite dev server on :5173, proxies /api to localhost:8080
npm run build        # tsc -b && vite build
npm run preview
```

## Architecture

### Monorepo / deployment shape
Single Railway deployment: the `Dockerfile` builds the frontend first and copies `frontend/dist` into `backend/src/main/resources/static`, so the Spring Boot JAR serves both the API and the static SPA from one process. `vite.config.ts` proxies `/api` to `localhost:8080` for local dev only.

### Backend — package-by-feature under `com.kostone.marble`
- `domain/<feature>` — JPA entities + Spring Data repositories (e.g. `domain/order`, `domain/customer`, `domain/financial`, `domain/signature`, `domain/logistics`, `domain/calendar`)
- `service/<feature>` — business logic, one service per domain area; controllers delegate to these
- `controller` — flat package, one `@RestController` per resource (`OrderController`, `CustomerController`, `PortalAuthController`, `CalendarController`, etc.)
- `dto/<feature>` — request/response records returned across the API boundary (entities are never serialized directly)
- `security` — `JwtAuthFilter`, `JwtUtil`, `MarbleUserDetails(Service)`, `SecurityConfig`
- `config` — `SecurityConfig`-adjacent beans: `WebConfig`, `JacksonConfig`, `TwilioConfig`, `LocalDataInitializer` (seeds local-profile data)
- `exception` — global exception handling

### The order lifecycle is the spine of the system
8-status state machine (`OrderStatus`): `QUOTATION → CLOSED_AWAITING_MEASUREMENT → REVIEWING_LAYOUT → PRODUCTION → AWAITING_INSTALLATION → {COMPLETED | PENDING_REPAIR} → ARCHIVED`. Full transition diagram and business rules live in `requirement.md` §3.

Valid transitions are enforced **in the application layer** (not the DB) via a static `Map<OrderStatus, Set<OrderStatus>>` table in `OrderService.transition()` (`backend/.../service/order/OrderService.java`) — invalid transitions throw `400`. Two transitions carry hard gates that throw `409 Conflict` if unmet:
- `QUOTATION → CLOSED_AWAITING_MEASUREMENT`: requires exactly 20% of `total_gross_amount` cleared in `financial_ledger` (tier 1)
- `REVIEWING_LAYOUT → PRODUCTION`: requires a `SLAB_LAYOUT_APPROVAL` row in `digital_signatures` for the order — **the only mandatory customer signature**, captured via the customer portal canvas

A customer may have at most one "open" order at a time (anything not in `{COMPLETED, ARCHIVED}`) — enforced in `OrderService.create()`.

`OrderTransitionTest` parameterizes over every valid/invalid transition pair — when changing the state machine, update `VALID_TRANSITIONS` and this test together.

### BigDecimal is enforced by an ArchUnit test
`BigDecimalArchRuleTest` (in `backend/src/test/.../arch`) fails the build if any class in `domain.financial`, `domain.order`, `service.financial`, or `service.order` declares a `float`/`double` field or returns one from a method. All financial and dimensional values **must** use `java.math.BigDecimal`. Don't introduce primitives in those packages — the test will catch it, but write `BigDecimal` from the start.

### Soft delete — never hard-delete `orders` or `customers`
Both tables carry `deleted_at TIMESTAMP WITH TIME ZONE` (NULL = active). Every read query must filter `deleted_at IS NULL` — repositories expose `findByIdAndDeletedAtIsNull` / `findAllActive` style methods for this; use them rather than the generic `findById`. Soft-delete via `softDelete()` (stamps `deleted_at = now()`), restore via `restore()` (`deleted_at = null`). All FKs referencing `orders`/`customers` use `ON DELETE RESTRICT` as a second safety layer (the lone exception: `calendar_events.related_order_id` uses `ON DELETE SET NULL`). Issuing `DELETE FROM orders`/`customers` from application code is considered a bug.

### Address inheritance via COALESCE
`customers.site_*` is mandatory; `orders.site_*` fields are nullable overrides. Effective address = `COALESCE(orders.site_*, customers.site_*)`. New orders pre-fill from the customer and only persist override fields when explicitly provided.

### Auth — two completely separate flows
- **Internal users** (Consultant/Hotman/Installer): username+password → Spring Security `DaoAuthenticationProvider` (BCrypt, strength 12) → stateless JWT carrying `{ sub, role, granted_features[] }`. `JwtAuthFilter` runs before `UsernamePasswordAuthenticationFilter`. Permissions are re-evaluated at every login (no stale-token risk).
- **Customers**: passwordless magic-link (email or WhatsApp) → `customer_portal_tokens` stores only a SHA-256 hash of the token (plaintext is sent, never persisted), single-use, time-limited (24h email / 2h WhatsApp) → 7-day JWT with `role = CUSTOMER`. `POST /api/v1/portal/auth/request` (Consultant-only) issues/replaces tokens; `GET /api/v1/portal/auth/verify` is the only public verify endpoint and gives a generic 401 on any failure (no enumeration).

`SecurityConfig` permits only: static frontend assets, `/api/v1/auth/login`, `/api/v1/portal/auth/verify`, and `/files/**`. Everything else requires authentication; method-level `@PreAuthorize` (via `@EnableMethodSecurity`) is layered on top for role/permission checks.

### Permission model — `user_permissions`, not boolean flags
Granular per-feature toggles (`feature_key` enum: `VIEW_ANALYTICS`, `VIEW_FINANCIAL_CHARTS`, `MANAGE_CALENDAR`, `VIEW_INSTALLER_RATINGS`, `EXPORT_REPORTS`), one row per `(user, feature)`, with `granted_by`/`granted_at` for audit. Only `SUPER_ADMIN_OWNER` can toggle them (`PUT /api/v1/admin/permissions/{userId}`). Note `VIEW_CALENDAR` is **not** a toggle — calendar read access is a role default for `FACTORY_MANAGER`; `MANAGE_CALENDAR` is the (currently unused) write-access flag.

### Notifications — port/adapter pattern
`NotificationPort` is the interface; `RealNotificationAdapter` (Gmail SMTP + Twilio WhatsApp) is used in production, `StubNotificationAdapter` in the `local` profile (surfaces magic links in the UI instead of sending them — no Twilio/Gmail credentials needed for local dev), `EmailNotificationAdapter` wraps SMTP specifically. Pick the right adapter when wiring new notification flows, and don't assume `RealNotificationAdapter` runs locally.

### Database migrations
Flyway migrations live in `backend/src/main/resources/db/migration`, named `V<n>__description.sql`, applied sequentially on startup (`spring.jpa.hibernate.ddl-auto=validate` in production — schema changes must go through Flyway, never auto-DDL). The full target schema (with rationale comments) is documented in `requirement.md` §5.

### Frontend structure
- `pages/` — one top-level component per role dashboard (`ConsultantDashboard`, `HotmanDashboard`, `InstallerDashboard`) plus `LoginPage` and `PortalMagicLinkVerify`
- `components/<role>/` — role-scoped components (`consultant/`, `hotman/`, `installer/`, `portal/`), plus `shared/` for cross-role pieces
- `api/` — one Axios wrapper module per backend resource (`orders.ts`, `customers.ts`, `calendar.ts`, `portal.ts`, ...) — controllers and api modules are 1:1
- `context/AuthContext.tsx` — auth state + global Axios interceptors: every request gets `Authorization: Bearer <token>` from `localStorage`; any `401` (when a session exists and the failing call isn't `/auth/login`) clears storage and redirects to `/login`
- `lib/constants.ts` — shared constants: the verbatim Hebrew crane disclaimer (`CRANE_DISCLAIMER_HE` — must appear on all customer-facing documents, never paraphrased), the constrained Israeli city list (`ISRAELI_CITIES`), phone validation pattern/helpers
- Routing (`App.tsx`) is role-gated: `RoleRoute` redirects to `/login` unless the JWT role matches the route's required role; `HomeRedirect` sends each authenticated role to its dashboard (`/consultant`, `/hotman`, `/installer`); `/portal/*` is the customer-facing magic-link portal

### RTL / Hebrew conventions (frontend)
Root HTML declares `dir="rtl" lang="he"`. Tailwind directional utilities (`pl-`, `pr-`, `ml-`, `mr-`, `text-left`, `text-right`, `rounded-r-`/`rounded-l-`) need explicit RTL review — prefer logical alternatives or `rtl:` variants. Font is Rubik (Google Fonts) globally. Dates render `DD/MM/YYYY`, currency as `₪`-prefixed with comma thousands separators.

## OpenSpec

This project uses OpenSpec (`openspec/changes/kostone-marble-erp/`) for spec-driven development — `proposal.md`, `design.md`, `tasks.md`, and per-feature `specs/<feature>/spec.md` files (e.g. `order-management`, `customer-management`, `order-lifecycle`, `data-safety`, `permission-toggles`). **Always update the relevant spec file(s) under `openspec/changes/kostone-marble-erp/specs/` whenever you change corresponding behavior** — specs and code must stay in sync without being asked.

`requirement.md` at the repo root is the original PRD/technical spec and is the canonical reference for business rules (state machine, permission matrix, signature rules, schema rationale) when in doubt.
