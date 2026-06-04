## Context

Kostone Marble is a greenfield ERP for an Israeli marble fabrication business. There is no existing codebase. The system serves four roles (Consultant, Hotman, Installer, Customer) across a complete order lifecycle from initial quote to post-installation archiving. The UI is entirely Hebrew (RTL). All business-critical data (orders, customers) must be protected against accidental deletion. The primary technical constraints are: Israeli market (Hebrew, ₪ NIS, WhatsApp-first communication), mobile field use for installers, and a small team requiring a single deployable unit rather than microservices.

## Goals / Non-Goals

**Goals:**
- Single deployable full-stack application (Spring Boot backend + React frontend served as static assets or separate Vite dev server)
- Enforce the 8-status order state machine with hard gates at the application service layer
- Enforce the `REVIEWING_LAYOUT → PRODUCTION` signature gate at both the API and database constraint levels
- Hebrew RTL UI throughout — zero English visible to end users
- PWA-based Installer mobile experience (no separate React Native app)
- Soft-delete on orders and customers with Consultant restore capability
- Automated daily database backups, 30-day retention

**Non-Goals:**
- Multi-language / i18n support — Hebrew only
- Native mobile app (iOS/Android) — PWA covers the Installer use case
- Multi-tenant / multi-business support — single Kostone Marble instance only
- Real-time collaborative editing — standard request/response is sufficient
- Offline-first sync for all roles — service worker caching covers the Installer's daily job load only

## Decisions

### 1. Backend: Java 21 / Spring Boot 3.x

**Chosen over Node.js/Express.** BigDecimal enforcement for all financial and dimensional values is a hard requirement. Java's `java.math.BigDecimal` is the mature, lint-enforceable solution. Floating-point primitives are rejected by a custom ArchUnit rule. Spring Security provides the JWT filter chain, method-level `@PreAuthorize` guards, and role/permission resolution out of the box.

### 2. Frontend: React 19 + Vite + TypeScript + TailwindCSS

Single-page application served from the same Railway deployment or a separate static host. TailwindCSS chosen for rapid RTL-compatible styling — all directional utilities (`pl-`, `pr-`, `text-left`) are reviewed for RTL correctness. The root HTML element sets `dir="rtl" lang="he"`. Rubik (Google Fonts) is the global font — designed for Hebrew, widely used in Israeli SaaS products.

### 3. Installer Mobile: PWA (not React Native)

**Chosen over React Native.** The Installer's requirements are: view today's jobs, capture a photo note, optionally capture a signature. All three are achievable with a responsive React component + `<input capture="environment">` + HTML5 Canvas. A separate React Native codebase would double maintenance burden. Service worker caches the Installer's daily job load on app open; signature submission queues offline and flushes on reconnect.

### 4. Authentication: Two separate flows

- **Internal users** (Consultant, Hotman, Installer): username + password → Spring Security → JWT with `{ sub, role, granted_features[] }`. Permissions re-evaluated at every login — no stale token risk.
- **Customers**: Magic-link via email or WhatsApp → `customer_portal_tokens` table stores SHA-256 hash (never plaintext) → single-use, time-limited → JWT with `{ sub: customer_id, role: CUSTOMER }`. No password ever created for customers.

**Chosen over session-based auth** because stateless JWT scales horizontally on Railway without sticky sessions.

### 5. Permission Model: `user_permissions` table (not boolean columns)

`analytics_visible BOOLEAN` (original approach) doesn't scale as features grow. The `user_permissions` table with a `feature_key` enum gives one auditable row per feature per user, with `granted_by` and `granted_at` for traceability. Adding a new toggleable feature requires only a new enum value and a UI toggle row — no schema migration needed for the pattern itself. `VIEW_CALENDAR` is not a toggle (role-default for FACTORY_MANAGER); `MANAGE_CALENDAR` is the write-access flag, defaulting to false.

### 6. Address Inheritance: COALESCE pattern

Customer has a mandatory `site_address`. Order has nullable address fields. Effective address = `COALESCE(orders.site_*, customers.site_*)`. Pre-filled from customer at order creation; Consultant can override per order. This gives a single source of truth for the common case (customer has one site) while supporting multi-property clients without schema duplication.

### 7. Soft Delete: `deleted_at` timestamp (not `is_deleted` boolean)

`deleted_at TIMESTAMP WITH TIME ZONE` preferred over `is_deleted BOOLEAN` because it records **when** the deletion happened (audit trail). All queries against `orders` and `customers` apply `WHERE deleted_at IS NULL`. A Consultant-only "Trash" view shows soft-deleted records with a restore button (`SET deleted_at = NULL`). All child table FKs use `ON DELETE RESTRICT` as a second safety layer.

### 8. Order State Machine: Application-layer enforcement + DB enum

Valid transitions are enforced in a Spring `OrderService` transition method — invalid transitions throw a `400 Bad Request`. The `REVIEWING_LAYOUT → PRODUCTION` gate additionally checks for a `SLAB_LAYOUT_APPROVAL` record in `digital_signatures` and throws `409 Conflict` if absent. The DB enum prevents unknown statuses at the persistence layer.

### 9. Calendar: Auto-creation via application-layer listener

On `logistics_assignments` INSERT, a Spring `@TransactionalEventListener` creates the linked `calendar_events` row. Event type: `is_primary = TRUE → INSTALLATION`, `is_primary = FALSE → SITE_VISIT`. Chosen over a PostgreSQL trigger to keep business logic in the application layer where it is testable and traceable.

### 10. Deployment: Railway.com monorepo

Backend JAR + frontend build artifact deployed to Railway. PostgreSQL plugin provides the managed database. Environment variables injected at runtime via Railway dashboard. Flyway runs migrations on startup before traffic is accepted. Daily backup snapshots enabled on the Railway PostgreSQL plugin with 30-day retention.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| PWA push notifications unreliable on iOS if not installed to home screen | WhatsApp notification (Twilio) sent as fallback for all installer dispatch events |
| JWT contains `granted_features[]` — stale if permissions change mid-session | Features re-evaluated at every login; for critical permission changes, Consultant can ask user to log out |
| SHA-256 token hash collision (theoretical) | Tokens are 32 cryptographically random bytes — collision probability negligible in practice |
| Railway.com backup restore is a full-instance restore (no table-level) | Soft-delete is the primary recovery mechanism; full restore only for catastrophic loss |
| BigDecimal enforcement relies on ArchUnit lint — can be bypassed with `@SuppressWarnings` | Code review policy: `@SuppressWarnings` on financial classes requires tech lead approval |
| Hebrew PDF rendering requires a Hebrew-capable font in the PDF library | Use iText/Apache PDFBox with Rubik or David font embedded in the JAR |

## Migration Plan

Greenfield build — no existing data to migrate. Deployment sequence:

1. Provision Railway PostgreSQL plugin and set environment variables
2. Deploy backend JAR — Flyway runs `V1__initial_schema.sql` on startup
3. Deploy frontend build — confirm `<html dir="rtl" lang="he">` and Rubik font load
4. Seed initial users: one `SUPER_ADMIN_OWNER` (Consultant), one `FACTORY_MANAGER` (Hotman)
5. Verify: create a test order, walk through full lifecycle to `COMPLETED`
6. Enable Railway daily backup schedule, confirm first snapshot completes

Rollback: Railway supports instant rollback to a previous deployment. Database rollback via Flyway undo migration or snapshot restore.

## Open Questions

- **PDF library choice**: iText 7 (commercial license) vs Apache PDFBox (Apache 2.0) for Hebrew layout plan PDFs — decision deferred to implementation
- **WhatsApp template approval**: Twilio WhatsApp Business requires pre-approved message templates for outbound messages — template copy in Hebrew needs to be drafted and submitted before notifications can go live
- **Railway backup restore SLA**: confirm Railway's documented RTO for a snapshot restore on their PostgreSQL plugin before go-live
