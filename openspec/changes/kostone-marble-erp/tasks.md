## 1. Project Scaffold & Infrastructure

- [x] 1.1 Initialise Spring Boot 3.x project with Java 21, Maven, Spring Web, Spring Security, Spring Data JPA, Spring Mail
- [x] 1.2 Initialise React 19 + Vite + TypeScript frontend project
- [x] 1.3 Install and configure TailwindCSS with RTL support; set `dir="rtl" lang="he"` on root HTML element
- [x] 1.4 Add Rubik font via Google Fonts import; set as global base font in Tailwind config
- [x] 1.5 Configure Railway.com project: PostgreSQL plugin, environment variables, daily backup schedule (30-day retention)
- [x] 1.6 Create `Dockerfile` multi-stage build (eclipse-temurin:21-jdk-jammy build → eclipse-temurin:21-jre-jammy runtime)
- [x] 1.7 Set up Flyway migration directory at `src/main/resources/db/migration`
- [x] 1.8 Add ArchUnit dependency and write rule to reject `float`/`double` in financial/dimensional classes

## 2. Database Schema (Flyway V1)

- [x] 2.1 Write `V1__initial_schema.sql` — all ENUMs: `user_role`, `order_status` (8 values with Hebrew comments), `sink_mount_style`, `signature_category`, `feature_key`, `calendar_event_type`
- [x] 2.2 Add `users` table with `full_name`, `username`, `password_hash`, `role`, `phone_number`
- [x] 2.3 Add `user_permissions` table with `UNIQUE(user_id, feature)` constraint
- [x] 2.4 Add `customers` table with mandatory `site_address`, `site_city`, nullable `site_floor`, `site_apt`, and `deleted_at`
- [x] 2.5 Add `orders` table with nullable address override fields, `notes TEXT`, `deleted_at`, and all FK constraints as `ON DELETE RESTRICT`
- [x] 2.6 Add `material_specifications`, `sink_specifications` tables with `ON DELETE RESTRICT` on `order_id`
- [x] 2.7 Add `logistics_assignments` table with `is_primary BOOLEAN NOT NULL DEFAULT TRUE` and `ON DELETE RESTRICT`
- [x] 2.8 Add `calendar_events` table; `related_order_id` uses `ON DELETE SET NULL`
- [x] 2.9 Add `financial_ledger` table with `CHECK (milestone_tier IN (1, 2))`
- [x] 2.10 Add `customer_portal_tokens` table with `token_hash VARCHAR(64)`, `delivery_channel CHECK`, `expires_at`, `used_at`
- [x] 2.11 Add `digital_signatures` table
- [x] 2.12 Seed initial `SUPER_ADMIN_OWNER` and `FACTORY_MANAGER` user rows in `V2__seed_users.sql`

## 3. Authentication & Security

- [x] 3.1 Implement JWT utility: sign with `JWT_SIGNING_KEY` env var; encode `sub`, `role`, `granted_features[]`
- [x] 3.2 Implement Spring Security filter chain: JWT extraction → validation → SecurityContext population
- [x] 3.3 Implement `POST /api/v1/auth/login` endpoint for internal users (username + password → JWT)
- [x] 3.4 Implement `POST /api/v1/portal/auth/request` — generate 32-byte token, SHA-256 hash, store in `customer_portal_tokens`, deliver via email or WhatsApp; invalidate previous unused tokens for same customer
- [x] 3.5 Implement `GET /api/v1/portal/auth/verify?token=` — hash incoming token, look up, validate expiry and used_at, return 7-day CUSTOMER JWT
- [x] 3.6 Add `@PreAuthorize` method guards to all service/controller methods by role and feature permission
- [x] 3.7 Write Spring Security integration tests for role-based access on key endpoints

## 4. Permission Toggles

- [x] 4.1 Implement `PUT /api/v1/admin/permissions/{userId}` — upsert `user_permissions` row; restrict to `SUPER_ADMIN_OWNER`
- [x] 4.2 Load `granted_features[]` from `user_permissions` at login time and embed in JWT claims
- [x] 4.3 Implement permission panel UI component (Consultant dashboard): five toggle rows, each firing the PUT endpoint on change

## 5. Customer & Order Management

- [x] 5.1 Implement `POST /api/v1/customers` — validate mandatory `site_address` + `site_city`; Consultant only
- [x] 5.2 Implement `GET /api/v1/customers` — filter `WHERE deleted_at IS NULL`
- [x] 5.3 Implement soft-delete for customers: `DELETE /api/v1/customers/{id}` sets `deleted_at`; add restore endpoint
- [x] 5.4 Implement `POST /api/v1/orders` — auto-inherit customer address into order fields; default status `QUOTATION`
- [x] 5.5 Implement `GET /api/v1/orders` — filter `WHERE deleted_at IS NULL`
- [x] 5.6 Implement soft-delete for orders: `DELETE /api/v1/orders/{id}` sets `deleted_at`; add restore endpoint
- [x] 5.7 Implement Consultant Trash view UI: list soft-deleted orders and customers with `deleted_at` date and Restore button
- [x] 5.8 Implement address COALESCE resolution in order detail and calendar event responses

## 6. Order Lifecycle & State Machine

- [x] 6.1 Implement `OrderService.transition(orderId, targetStatus)` — enforce valid-transition table; throw `400` on invalid transition
- [x] 6.2 Add 20% deposit gate in transition from `QUOTATION → CLOSED_AWAITING_MEASUREMENT`: check `financial_ledger` for cleared milestone-1 record
- [x] 6.3 Add layout signature gate in transition from `REVIEWING_LAYOUT → PRODUCTION`: check `digital_signatures` for `SLAB_LAYOUT_APPROVAL` record; throw `409` if absent
- [x] 6.4 Implement `PUT /api/v1/orders/{id}/status` endpoint — calls `OrderService.transition`
- [x] 6.5 Write unit tests for all 9 valid transitions and at least 5 invalid transition rejections
- [x] 6.6 Write integration test specifically for the layout-signature gate: attempt PRODUCTION without signature (expect 409), add signature, retry (expect 200)

## 7. Financial Ledger

- [x] 7.1 Implement `POST /api/v1/orders/{id}/payments` — create `financial_ledger` entry with BigDecimal amount; Consultant only
- [x] 7.2 Implement `PUT /api/v1/orders/{id}/payments/{ledgerId}/clear` — mark milestone as cleared
- [x] 7.3 Add BigDecimal validation: reject any ledger entry where `amount_allocated` uses floating-point source

## 8. Digital Signatures

- [x] 8.1 Implement `POST /api/v1/orders/{id}/signatures` — create `digital_signatures` record; accept `category`, `signatureData` (base64), `ipAddress`
- [x] 8.2 Implement pre-measurement disclaimer signature capture in customer portal UI (HTML5 Canvas → `PRE_MEASUREMENT_DISCLAIMER`)
- [x] 8.3 Implement layout approval signature capture in customer portal UI (HTML5 Canvas → `SLAB_LAYOUT_APPROVAL`)
- [x] 8.4 Implement optional post-installation signature in Installer mobile UI (HTML5 Canvas → `FINAL_POST_INSTALLATION`)

## 9. Factory & SLA Module

- [x] 9.1 Implement layout document upload endpoint: `POST /api/v1/orders/{id}/layout` — attach PDF to order, notify customer
- [x] 9.2 Implement `POST /api/v1/orders/{id}/logistics` — create `logistics_assignments` row; trigger calendar event auto-creation via Spring `@TransactionalEventListener`
- [x] 9.3 Implement calendar auto-creation listener: `is_primary = TRUE → INSTALLATION`, `is_primary = FALSE → SITE_VISIT`
- [x] 9.4 Implement SLA Alert Deck UI (Hotman): display active PRODUCTION orders as cards with decrementing timer; color-code by urgency (green/yellow/red)
- [x] 9.5 Implement Blueprints Panel UI (Hotman): file upload for layout PDFs, view field measurements

## 10. Installation Calendar

- [x] 10.1 Implement `GET /api/v1/calendar/events` — role-scoped: Consultant gets all; Hotman gets all read-only; Installer gets own only
- [x] 10.2 Implement `POST /api/v1/calendar/events` — Consultant or MANAGE_CALENDAR permission required
- [x] 10.3 Implement `PUT` and `DELETE /api/v1/calendar/events/{id}` — same permission guard
- [x] 10.4 Build full-month RTL calendar UI component (Consultant): Hebrew day/month labels, week starts Sunday, CRUD controls
- [x] 10.5 Build read-only calendar view (Hotman): same month view, no edit controls, financial data hidden in event panel
- [x] 10.6 Build Installer daily list view (mobile): own jobs only, shows effective address, time window, access notes
- [x] 10.7 Add Calendar Preview Strip to Hotman dashboard (compact weekly strip, always visible)
- [x] 10.8 Implement event detail side panel: role-filtered fields (financial data visible to Consultant only)

## 11. Customer Portal

- [x] 11.1 Implement `GET /api/v1/portal/orders` — CUSTOMER role, scoped to JWT's `customer_id`
- [x] 11.2 Build customer portal shell: Hebrew RTL, order list with status in Hebrew, payment milestone history
- [x] 11.3 Build layout approval screen: display uploaded layout PDF, HTML5 Canvas signature widget, confirm button
- [x] 11.4 Build pre-measurement disclaimer screen: Hebrew disclaimer text, accept button triggers `PRE_MEASUREMENT_DISCLAIMER` signature

## 12. Analytics Dashboard

- [x] 12.1 Implement analytics data endpoints: monthly revenue, inflow vs receivables, material volumetrics, SLA compliance, installer ratings — all Consultant-only
- [x] 12.2 Build analytics dashboard UI: revenue line chart, material pie chart, SLA compliance time-series, installer performance list
- [x] 12.3 Integrate chart library (Recharts or Chart.js); ensure RTL-compatible label rendering

## 13. Notifications

- [x] 13.1 Configure Spring Mail with `kostonemarble@gmail.com` SMTP credentials
- [x] 13.2 Configure Twilio WhatsApp API client with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` env vars
- [x] 13.3 Implement notification service with Hebrew templates for all 5 trigger events (measurements uploaded, layout ready, layout signed, installer dispatched, job complete)
- [x] 13.4 Submit Hebrew WhatsApp Business message templates to Twilio for approval before go-live
- [x] 13.5 Implement email fallback when WhatsApp delivery fails; log failure

## 14. Hebrew UI & RTL Polish

- [x] 14.1 Audit all Tailwind directional utilities (`pl-`, `pr-`, `ml-`, `mr-`, `rounded-l-`, `rounded-r-`, `text-left`, `text-right`) for RTL correctness
- [x] 14.2 Verify all navigation, icon directions, and modal alignments render correctly in Hebrew RTL
- [x] 14.3 Set date format `DD/MM/YYYY` and currency display `₪` prefix in all date/number formatters
- [x] 14.4 Ensure calendar week starts on Sunday (Israeli standard) in all calendar views
- [x] 14.5 Ensure crane disclaimer appears in Hebrew on all customer-facing generated documents

## 15. Deployment & Go-Live

- [x] 15.1 Configure all environment variables in Railway dashboard
- [x] 15.2 Deploy backend; verify Flyway runs `V1__initial_schema.sql` successfully on first boot
- [x] 15.3 Deploy frontend; verify `dir="rtl"`, Rubik font, and all Hebrew labels render correctly
- [x] 15.4 Seed Consultant and Hotman user accounts
- [x] 15.5 Walk through full order lifecycle end-to-end: QUOTATION → CLOSED_AWAITING_MEASUREMENT → REVIEWING_LAYOUT → (signature) → PRODUCTION → AWAITING_INSTALLATION → COMPLETED → ARCHIVED
- [x] 15.6 Confirm daily backup schedule is active; verify first snapshot completes and backup alert email is received
- [x] 15.7 Test magic-link flow: send invite, click link, access portal, sign layout
- [x] 15.8 Test Installer mobile PWA: install to home screen, view calendar, complete job, optional signature
