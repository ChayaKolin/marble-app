## ADDED Requirements

### Requirement: Order status follows an 8-state machine with enforced transitions
The system SHALL enforce the following and only the following valid transitions. Any attempt to move an order to a non-adjacent state SHALL be rejected.

Valid transitions:
- `QUOTATION` → `CLOSED_AWAITING_MEASUREMENT` (20% deposit paid)
- `CLOSED_AWAITING_MEASUREMENT` → `REVIEWING_LAYOUT` (measurements uploaded)
- `REVIEWING_LAYOUT` → `PRODUCTION` (SLAB_LAYOUT_APPROVAL signature present — hard gate)
- `PRODUCTION` → `AWAITING_INSTALLATION` (factory cutting complete)
- `AWAITING_INSTALLATION` → `COMPLETED` (installation done, FINAL_POST_INSTALLATION signature present — hard gate, 80% payment confirmed)
- `AWAITING_INSTALLATION` → `PENDING_REPAIR` (on-site issue found)
- `PENDING_REPAIR` → `AWAITING_INSTALLATION` (return visit scheduled)
- `PENDING_REPAIR` → `COMPLETED` (repair done, fully resolved, FINAL_POST_INSTALLATION signature present — hard gate)
- `COMPLETED` → `ARCHIVED` (manual archiving by Consultant)

#### Scenario: Valid transition accepted
- **WHEN** the Consultant moves an order from `QUOTATION` to `CLOSED_AWAITING_MEASUREMENT` after the 20% deposit is confirmed
- **THEN** the order status is updated and the new status is persisted

#### Scenario: Invalid transition rejected
- **WHEN** the system receives a request to move an order from `QUOTATION` directly to `PRODUCTION`
- **THEN** the system returns HTTP 400 and the order status remains unchanged

### Requirement: REVIEWING_LAYOUT to PRODUCTION is hard-gated by layout signature
The system SHALL refuse the transition from `REVIEWING_LAYOUT` to `PRODUCTION` if no `SLAB_LAYOUT_APPROVAL` record exists in `digital_signatures` for the order.

#### Scenario: Transition blocked — no signature
- **WHEN** the Consultant attempts to advance an order from `REVIEWING_LAYOUT` to `PRODUCTION` and no `SLAB_LAYOUT_APPROVAL` signature exists for that order
- **THEN** the system returns HTTP 409 with a message indicating the customer layout signature is required

#### Scenario: Transition allowed — signature present
- **WHEN** the Consultant advances an order from `REVIEWING_LAYOUT` to `PRODUCTION` and a valid `SLAB_LAYOUT_APPROVAL` signature record exists for that order
- **THEN** the order transitions to `PRODUCTION` and the SLA timer is initiated

### Requirement: {AWAITING_INSTALLATION, PENDING_REPAIR} to COMPLETED is hard-gated by the final installation signature
The system SHALL refuse the transition to `COMPLETED` (from `AWAITING_INSTALLATION` or `PENDING_REPAIR`) if no `FINAL_POST_INSTALLATION` record exists in `digital_signatures` for the order. This signature is the customer's explicit confirmation that everything arrived as ordered, and is a prerequisite for collecting the final (80%) payment.

The `FINAL_POST_INSTALLATION` signature can be collected via **two routes** — either satisfies the gate:

1. **On the installer's device** — the Installer opens their daily-jobs list, taps "סיום עבודה — חתימת לקוח", and hands the device to the customer to sign on-screen (`INSTALLER` role submits `POST /api/v1/orders/{id}/signatures` with `FINAL_POST_INSTALLATION` and then marks logistics complete).

2. **Via the customer portal** — the Consultant sends the customer a portal magic-link from STEP 5 (`AWAITING_INSTALLATION`). The customer opens the link, views the installed item list, checks the confirmation box, and signs. The portal calls `POST /api/v1/orders/{id}/signatures` with `FINAL_POST_INSTALLATION` under the `CUSTOMER` JWT (both `INSTALLER` and `CUSTOMER` roles are allowed to submit this category).

The Consultant's order detail view SHALL reflect the signature status in STEP 5 (`AWAITING_INSTALLATION`/`PENDING_REPAIR`):
- While unsigned: an amber notice explains that the Installer must collect the signature on their dashboard; the "סמן כהושלם" button is disabled.
- Once signed: a green "✓ הלקוח חתם על אישור סיום ההתקנה" confirmation appears and the button becomes active.
- The view SHALL poll the signatures endpoint every 10 seconds while in `AWAITING_INSTALLATION` and the signature is absent, so the button unlocks automatically without a page refresh.

#### Scenario: Transition blocked — no final installation signature
- **WHEN** the Consultant attempts to advance an order from `AWAITING_INSTALLATION` or `PENDING_REPAIR` to `COMPLETED` and no `FINAL_POST_INSTALLATION` signature exists for that order
- **THEN** the system returns HTTP 409 with a message indicating the customer's signature confirming the installation is required before completion; the Consultant UI also disables the "סמן כהושלם" button pre-emptively so the 409 is rarely reached

#### Scenario: Consultant sees that signature is pending
- **WHEN** an order is in `AWAITING_INSTALLATION` and the `FINAL_POST_INSTALLATION` signature has not yet been collected
- **THEN** the order detail view shows an amber notice explaining that the Installer needs to collect the customer's signature on the installer dashboard, and the "סמן כהושלם" button is disabled

#### Scenario: Consultant's view auto-updates once the Installer signs
- **WHEN** the Installer collects the final installation signature and the Consultant's order detail view is open (polling every 10 s)
- **THEN** the amber notice is replaced by a green confirmation and the "סמן כהושלם" button becomes enabled — without a manual page refresh

#### Scenario: Transition allowed — final installation signature present
- **WHEN** the Consultant advances an order from `AWAITING_INSTALLATION` or `PENDING_REPAIR` to `COMPLETED` and a `FINAL_POST_INSTALLATION` signature record exists for that order
- **THEN** the order transitions to `COMPLETED`

### Requirement: QUOTATION to CLOSED_AWAITING_MEASUREMENT requires 20% deposit
The system SHALL refuse the transition from `QUOTATION` to `CLOSED_AWAITING_MEASUREMENT` if the `financial_ledger` does not contain a cleared `milestone_tier = 1` record covering at least 20.00% of `total_gross_amount`.

#### Scenario: Transition blocked — deposit not paid
- **WHEN** a transition from `QUOTATION` to `CLOSED_AWAITING_MEASUREMENT` is requested and no cleared milestone-1 record exists
- **THEN** the system returns HTTP 409 indicating the 20% deposit must be confirmed first

#### Scenario: Transition allowed — deposit confirmed
- **WHEN** a cleared milestone-1 ledger record exists covering exactly 20.00% of the order's gross amount
- **THEN** the transition to `CLOSED_AWAITING_MEASUREMENT` is allowed

### Requirement: PENDING_REPAIR status handles return visit cycles
The system SHALL allow an order to enter and exit `PENDING_REPAIR` multiple times. Each entry SHALL result in a new `logistics_assignment` with `is_primary = FALSE` and an auto-generated `SITE_VISIT` calendar event.

#### Scenario: Order enters PENDING_REPAIR
- **WHEN** the Consultant moves an order from `AWAITING_INSTALLATION` to `PENDING_REPAIR`
- **THEN** the order status is set to `PENDING_REPAIR` and the Consultant is prompted to create a return-visit logistics assignment

#### Scenario: Order exits PENDING_REPAIR to COMPLETED
- **WHEN** the Consultant moves an order from `PENDING_REPAIR` to `COMPLETED`
- **THEN** the order is marked complete and no further PENDING_REPAIR transitions are expected
