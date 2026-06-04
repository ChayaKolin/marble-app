# Kostone Marble — Product Requirements Document (PRD)

## 1. Executive Summary & System Overview

This application is a custom ERP and Order Management system for Kostone Marble. It serves the Consultant/Owner, Factory Manager (Hotman), Installers (Field Crew), and End Customers.

The system enforces strict workflow states, maintains a secure financial ledger, provides analytics, and automates notifications and digital contract signing.

Default email for signed contracts: kostonemarble@gmail.com

## 2. User Roles & Permissions

### 2.1 Consultant / Owner
- Role: `ROLE_SUPER_ADMIN`
- Full access to customers, orders, ledger, dashboards, and system overrides.
- Can toggle whether the Factory Manager may view financial charts and statistics.

### 2.2 Factory Manager (Hotman)
- Role: `ROLE_FACTORY_MANAGER`
- Manages production orders, logs slab issues, schedules installers, and monitors SLA.
- Cannot see financial charts unless Owner enables access.

### 2.3 Installer (Field Crew)
- Role: `ROLE_INSTALLER`
- Mobile-friendly schedule view, field checklist, and digital customer sign-off.

### 2.4 End Customer
- Role: `ROLE_CUSTOMER`
- Passwordless portal via OTP or magic link.
- Views order progress, downloads documents, and approves slab layouts.

## 3. Workflow

1. Lead intake and plan upload
2. Material and sink selection
3. 20% deposit locks the order and unlocks measurement
4. Client slab layout approval
5. SLA countdown starts, fabrication and QA proceed
6. Installer scheduling
7. 80% balance verification
8. Installation and final sign-off

## 4. Financial & Production Rules

- 20% deposit is required before scheduling measurement or fabrication.
- 80% balance is required before installers can complete the order.
- The backend enforces these blocks in the API layer.
- Fabrication is blocked until slab layout approval and client signature are stored.

## 5. Dashboards

### Owner Dashboard
- Sales trends, material popularity, conversion rates, profit analysis, SLA compliance.

### Factory Dashboard
- Production queue, installer load, yield/waste metrics.
- Financial charts hidden by default unless enabled by Owner.

## 6. File and Signature Workflow

- Secure uploads for blueprints, measurements, and slab layouts.
- Customers approve layouts digitally inside their portal.
- Signed delivery PDFs are emailed to the Owner and the client.
