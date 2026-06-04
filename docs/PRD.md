# Kostone Marble — Product Requirements Document (PRD)

## 1. Executive Summary & System Overview

This application is an end-to-end ERP and Order Management system custom-built for Kostone Marble, a premium marble consulting, fabrication, and installation business.

Primary goals:
- Bridge workflow, communication, and financial gaps between Consultant (Owner), Factory Manager (Hotman), Installers (Field Crew), and End Customers.
- Enforce strict workflow state machine constraints.
- Maintain a rigorous financial ledger to eliminate leakage.
- Display analytics and automate notifications and contract signing.

System email (default sender/receiver of signed contracts): kostonemarble@gmail.com

## 2. User Roles, Hierarchy & Permissions Matrix

RBAC with strict security. The Consultant (Owner) is the Super Admin and controls visibility and overrides.

### 2.1 Consultant (Primary User / Owner)
- Role: `ROLE_SUPER_ADMIN`
- Capabilities:
  - Create/update/archive customers and leads.
  - Manually advance order statuses or bypass system blocks.
  - Full access to financial ledger (billing, payments, margins, taxes).
  - Executive dashboard: 12-month sales chart, material breakdown, conversion rates.
  - Toggle whether Factory Manager can view financial statistics.

### 2.2 Factory Manager (Hotman)
- Role: `ROLE_FACTORY_MANAGER`
- Capabilities:
  - Manage orders in fabrication/cutting (PRODUCTION).
  - Log slab cutting completion times and issues by slab ID.
  - Assign installation dates and installers.
  - View production metrics (throughput, delays, inventory, SLA).
  - Financial charts hidden by default; visible only if owner toggles access.

### 2.3 Installer (Field Crew)
- Role: `ROLE_INSTALLER`
- Capabilities:
  - Mobile-optimized interface for field use.
  - Daily schedule with addresses and contact details.
  - Mandatory field checklist and digital customer sign-off on completion.

### 2.4 End Customer
- Role: `ROLE_CUSTOMER`
- Capabilities:
  - Passwordless portal via phone OTP or email magic link.
  - Order status tracker with visual progress bar.
  - Document center for plans, material details, and invoices.
  - Slab layout viewing, annotation, and digital sign-off.

## 3. Workflow Overview (high-level)

[Lead Intake & Plan Upload] → [Material & Sink Selection] → [20% Deposit Locked] → [Unlock Field Measurement]
→ [Client Slab Approval] → [Fabrication & QA] → [Schedule Installer] → [80% Final Payment Verified] → [Installation & Final Sign-off]

### 3.1 Customer Intake & Technical Documentation
- Customer profile fields: name, phone, email, address, optional architect/designer.
- Secure upload vault for PDFs, blueprints, and site photos.

### 3.2 Technical Specifications Configurator
- Material matrix: Slab ID, model/code, finish type, square meters.
- Edge profiles, sink & cutout specs, faucet configuration.
- Fixed structural add-ons (e.g., cooktop base fee locked at 200 NIS).
- Logistics & access flags: elevator size, stairwell width, carry distance.
- Legal disclaimer appended to estimates and PDFs regarding crane services.

### 3.3 Financial Milestones & Ledger Rules
- Milestone 1 (20% deposit): required to move out of AWAITING_DEPOSIT.
- Milestone 2 (80% balance): required before installers can submit completion.
- Backend enforces blocks: scheduling and dispatching are prevented until payments are recorded.

### 3.4 Measurement & Fabrication
- Automated email to client after deposit: explains estimate is provisional until measurements.
- Consultant uploads laser measurement files; system recalculates square meters and final price.
- Hotman uploads slab cutting layout; client must digitally sign layout before fabrication.

### 3.5 SLA & Production Tracking
- SLA countdown starts after client slab approval; alerts trigger if SLA near-expiry.
- Fabrication pipeline: Slab Cutting → CNC Routing → Edge Polishing → QA.

### 3.6 Dispatch, Installation & Sign-off
- Hotman assigns installer and date.
- Installer completes checklist and captures on-screen customer signature.
- Signed delivery PDF emailed to `kostonemarble@gmail.com` and the client.

## 4. Analytics & Dashboards (User-specific views)

### Executive Dashboard (Owner)
- Financial health: gross revenue, AR, monthly net profit, cash-flow forecast.
- Monthly sales (12-month running bar chart).
- Material popularity (pie chart), lead-to-order funnel, SLA compliance dial.

### Factory Dashboard (Hotman)
- Factory queue load, installer load balancing calendar, material yield/waste tracking.
- Financial charts hidden by default (shows locked placeholder unless toggled on).

---
References and technical details are provided separately in `docs/TECHNICAL_SPEC.md`.
