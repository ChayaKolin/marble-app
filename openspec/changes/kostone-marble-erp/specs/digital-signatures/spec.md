## ADDED Requirements

### Requirement: SLAB_LAYOUT_APPROVAL signature is mandatory and blocks production
The system SHALL require a `digital_signatures` record with `category = SLAB_LAYOUT_APPROVAL` for an order before allowing the status transition from `REVIEWING_LAYOUT` to `PRODUCTION`. This check SHALL occur at the service layer and SHALL return HTTP 409 if the record is absent.

#### Scenario: Production blocked without layout signature
- **WHEN** the Consultant attempts to advance an order to `PRODUCTION` and no SLAB_LAYOUT_APPROVAL signature exists
- **THEN** the system returns HTTP 409 and displays a Hebrew message indicating the customer must sign the layout plan first

#### Scenario: Customer signs layout via portal
- **WHEN** a customer accesses their portal, reviews the uploaded layout plan, and submits their signature via the HTML5 Canvas component
- **THEN** a `digital_signatures` record with `category = SLAB_LAYOUT_APPROVAL` is written, unlocking the PRODUCTION transition

### Requirement: Consultant sees the layout signature appear without reloading
While an order is on the `REVIEWING_LAYOUT` step and no `SLAB_LAYOUT_APPROVAL` signature exists yet, the order detail "workflow" tab SHALL periodically re-check `GET /api/v1/orders/{id}/signatures` in the background. As soon as a `SLAB_LAYOUT_APPROVAL` record is found, the signature status SHALL update to "✓ חתום — מאושר לייצור" and the "הורד לייצור" (advance to PRODUCTION) action SHALL become available, without the Consultant needing to refresh or reopen the order.

#### Scenario: Signature appears automatically after the customer signs
- **WHEN** the Consultant is viewing the REVIEWING_LAYOUT step of an order awaiting the customer's layout signature, and the customer signs via the portal in the meantime
- **THEN** the workflow tab updates on its own to show "✓ חתום — מאושר לייצור" and enables the "הורד לייצור" button, without a manual page reload

### Requirement: PRE_MEASUREMENT_DISCLAIMER signature is captured in the customer portal
The system SHALL present a mandatory acknowledgement dialog to the customer in the portal before measurement-related actions. The acknowledgement SHALL be captured as a `PRE_MEASUREMENT_DISCLAIMER` record in `digital_signatures`.

#### Scenario: Customer acknowledges pre-measurement disclaimer
- **WHEN** a customer in the portal accepts the disclaimer: "המחיר הסופי, המידות והפרטים הספציפיים נקבעים אך ורק לאחר מדידה מקצועית"
- **THEN** a `PRE_MEASUREMENT_DISCLAIMER` signature record is written for the order

### Requirement: FINAL_POST_INSTALLATION signature is mandatory before the installer can finish the job and before the order can be completed
The system SHALL require the Installer to capture a `FINAL_POST_INSTALLATION` signature from the customer, confirming the installation is fully complete and arrived as ordered, before the logistics assignment can be marked complete and before the order can move to `COMPLETED`. The signing form SHALL include an optional free-text notes field (`notes` on `digital_signatures`), captured alongside the signature. `PATCH /api/v1/orders/{orderId}/logistics/{assignmentId}/complete` SHALL return HTTP 409 if no `FINAL_POST_INSTALLATION` signature exists yet for the order. Once the assignment is marked complete, the Installer is shown that they may proceed to collect the remaining balance from the customer.

#### Scenario: Mandatory signature captured with notes
- **WHEN** the customer signs on the Installer's device after installation, optionally with completion notes entered by the Installer
- **THEN** a `FINAL_POST_INSTALLATION` record (including the `notes`, if provided) is written to `digital_signatures`, and the logistics assignment is marked `is_completed = TRUE`

#### Scenario: Job completion blocked without the customer's signature
- **WHEN** the Installer attempts to mark the job complete (`PATCH .../logistics/{assignmentId}/complete`) before a `FINAL_POST_INSTALLATION` signature exists for the order
- **THEN** the system returns HTTP 409 with a Hebrew message indicating the customer's signature confirming completion is required first

#### Scenario: Installer is shown they may collect the remaining balance
- **WHEN** the assignment is successfully marked complete after the signature is captured
- **THEN** the Installer's daily job list shows a confirmation that the job is done and the remaining balance may now be collected from the customer

#### Scenario: Order completion blocked without the customer's signature
- **WHEN** the Consultant attempts to advance an order from `AWAITING_INSTALLATION` or `PENDING_REPAIR` to `COMPLETED` and no `FINAL_POST_INSTALLATION` signature exists for the order
- **THEN** the system returns HTTP 409 with a Hebrew message indicating the customer's signature confirming the installation arrived as ordered is required before completion and final payment

#### Scenario: Order completion allowed once the customer's signature exists
- **WHEN** the Consultant advances an order from `AWAITING_INSTALLATION` or `PENDING_REPAIR` to `COMPLETED` and a `FINAL_POST_INSTALLATION` signature record exists for the order
- **THEN** the order transitions to `COMPLETED`

### Requirement: Signature data stored as SHA-256-hashed canvas payload
Signature vector data SHALL be stored as a compressed base64 payload or canvas coordinate encoding in `signature_vector_data TEXT`. IP address of the signing session SHALL be captured in `ip_address`.

#### Scenario: Signature record created
- **WHEN** a signature is submitted
- **THEN** the system persists `signature_vector_data`, `ip_address`, `notes`, `order_id`, `category`, and `signed_at` in `digital_signatures`
