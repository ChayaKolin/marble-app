## Why

Kostone Marble is a marble and stone fabrication business operating without a dedicated management system — orders, measurements, factory scheduling, customer approvals, and installer dispatch are tracked manually. This creates data dropouts between field measurements, factory production, and on-site delivery, and exposes the business to unauthorized financial actions and unrecoverable record loss. A purpose-built ERP is needed now to bring the full order lifecycle under a single, enforced, auditable system.

## What Changes

- Introduce a full Hebrew-language ERP web application (RTL, Rubik font) replacing all manual tracking
- Implement a role-based access control system with four distinct roles: Consultant (Super-Admin), Factory Manager (Hotman), Installer, and Customer
- Implement an 8-status order lifecycle with hard gates enforced at the database and application layers
- Introduce a mandatory digital signature gate: `REVIEWING_LAYOUT → PRODUCTION` is blocked until the customer signs the slab layout plan via their portal
- Introduce a post-installation optional signature capture on the Installer's mobile device
- Implement a granular per-feature permission toggle system (replacing any flat boolean flags) for the Consultant to control Hotman's access to analytics, financial charts, calendar write access, and reports
- Introduce an Installation Calendar visible to both Consultant (full CRUD) and Hotman (read-only by role default), with write access grantable to Hotman via a single toggle
- Implement a passwordless magic-link customer portal (email + WhatsApp delivery) scoped to the customer's own orders, supporting layout plan signing and order tracking
- Implement a soft-delete pattern on `orders` and `customers` — no hard deletes, fully restorable by the Consultant
- Configure automated daily database backups with 30-day retention on Railway.com
- Deploy on Railway.com with PostgreSQL, Flyway migrations, and a multi-stage Java 21 / Spring Boot 3.x container

## Capabilities

### New Capabilities

- `user-roles-and-auth`: RBAC system with Consultant, Hotman, Installer, and Customer roles; JWT-based auth for internal users; magic-link portal auth for customers
- `order-lifecycle`: 8-status order state machine (QUOTATION → CLOSED_AWAITING_MEASUREMENT → REVIEWING_LAYOUT → PRODUCTION → AWAITING_INSTALLATION → PENDING_REPAIR → COMPLETED → ARCHIVED) with financial milestone gates and valid-transition enforcement
- `customer-management`: Customer profiles with mandatory site address, soft-delete, and portal invite management
- `order-management`: Order creation with address inheritance/override, material specs, sink specs, logistics access flags, notes, and soft-delete
- `financial-ledger`: BigDecimal-enforced two-milestone payment tracking (20% deposit gate, 80% balance confirmation)
- `digital-signatures`: Three-category signature system — PRE_MEASUREMENT_DISCLAIMER, SLAB_LAYOUT_APPROVAL (mandatory production gate), FINAL_POST_INSTALLATION (optional)
- `factory-and-sla`: Hotman's SLA production timer, layout blueprint upload, installer dispatch, and PENDING_REPAIR return-visit flow
- `installation-calendar`: Cross-role scheduling hub; Consultant full CRUD, Hotman read-only by default, Installer personal daily slice; MANAGE_CALENDAR toggle for future Hotman write access
- `customer-portal`: Magic-link authenticated portal (email + WhatsApp); customers view own orders, sign layout plans, track status and payments
- `analytics-dashboard`: Consultant-only master dashboard with revenue charts, material volumetrics, SLA compliance rates, and installer performance; all metrics hidden from Hotman by default with per-feature toggle control
- `permission-toggles`: Per-feature permission flag system (user_permissions table) allowing Consultant to grant/revoke VIEW_ANALYTICS, VIEW_FINANCIAL_CHARTS, MANAGE_CALENDAR, VIEW_INSTALLER_RATINGS, EXPORT_REPORTS for Hotman
- `notifications`: Automated Hebrew-language email and WhatsApp notifications (Twilio) for key workflow events — measurement uploaded, layout ready for signing, installer dispatched, job complete
- `data-safety`: Soft-delete on orders and customers, ON DELETE RESTRICT FK protection, automated daily backups with 30-day retention

### Modified Capabilities

## Impact

- **New system** — no existing codebase to migrate; greenfield build
- **Database**: PostgreSQL on Railway.com; all schema changes via Flyway migrations; soft-delete pattern on orders and customers
- **Backend**: Java 21 / Spring Boot 3.x; BigDecimal enforced for all financial and dimensional values; Spring Security JWT with `granted_features[]` permission claims
- **Frontend**: React 19 / Vite / TypeScript; TailwindCSS with full RTL support (`dir="rtl" lang="he"`); Rubik font; Hebrew-only UI
- **External services**: Twilio WhatsApp API for notifications and magic-link delivery; `kostonemarble@gmail.com` for email delivery
- **Hosting**: Railway.com with PostgreSQL plugin, automated daily backups, Flyway migration on startup
