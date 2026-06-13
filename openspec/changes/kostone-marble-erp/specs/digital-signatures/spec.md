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

### Requirement: FINAL_POST_INSTALLATION signature is optional
The system SHALL allow but not require the Installer to capture a `FINAL_POST_INSTALLATION` signature from the customer on the mobile device after job completion. The absence of this signature SHALL NOT block order completion or payment confirmation.

#### Scenario: Optional signature captured
- **WHEN** the customer signs on the Installer's device after installation
- **THEN** a `FINAL_POST_INSTALLATION` record is written to `digital_signatures` as a record only

#### Scenario: Job complete without signature
- **WHEN** the Installer marks the job complete without capturing a signature
- **THEN** the logistics assignment is marked `is_completed = TRUE` with no signature record, and the Consultant can still advance the order

### Requirement: Signature data stored as SHA-256-hashed canvas payload
Signature vector data SHALL be stored as a compressed base64 payload or canvas coordinate encoding in `signature_vector_data TEXT`. IP address of the signing session SHALL be captured in `ip_address`.

#### Scenario: Signature record created
- **WHEN** a signature is submitted
- **THEN** the system persists `signature_vector_data`, `ip_address`, `order_id`, `category`, and `signed_at` in `digital_signatures`
