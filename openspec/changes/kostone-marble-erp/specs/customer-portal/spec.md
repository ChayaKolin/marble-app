## ADDED Requirements

### Requirement: Customer portal is scoped to the authenticated customer's own orders
The system SHALL return only orders where `customer_id` matches the JWT's `sub` claim. No cross-customer data SHALL be accessible via any portal endpoint.

#### Scenario: Customer sees only their orders
- **WHEN** a customer accesses `GET /api/v1/portal/orders`
- **THEN** only orders linked to their customer ID are returned

#### Scenario: Cross-customer access blocked
- **WHEN** a customer attempts to access an order belonging to a different customer
- **THEN** the system returns HTTP 404 (not 403, to avoid confirming the order exists)

### Requirement: Customer can track order status and payment milestones
The customer portal SHALL display the current order status (in Hebrew), payment milestone history (which milestones are cleared), and order details. Financial totals visible to the customer are limited to their own order amounts.

#### Scenario: Customer views order status
- **WHEN** a customer opens their portal
- **THEN** they see the current status of each order in Hebrew (e.g., "ייצור"), and which payment milestones have been cleared

### Requirement: Customer signs layout plan via portal
The customer portal SHALL display the order's marble/stone and sink specifications, the uploaded layout plan document, and a signature canvas. The customer SHALL be able to draw their signature and submit it. On submission the system SHALL create a `SLAB_LAYOUT_APPROVAL` record in `digital_signatures`, unlocking the PRODUCTION transition.

#### Scenario: Customer signs layout
- **WHEN** a customer draws their signature on the canvas and taps confirm
- **THEN** the signature base64 payload is submitted, a SLAB_LAYOUT_APPROVAL record is created, and the portal shows a confirmation in Hebrew

#### Scenario: Layout not yet uploaded
- **WHEN** a customer opens their portal but Hotman has not yet uploaded the layout
- **THEN** the portal shows a status message in Hebrew indicating the layout is being prepared

#### Scenario: Customer reviews the specification before signing
- **WHEN** a customer opens the layout-approval screen for an order with marble/stone and/or sink specifications
- **THEN** the screen shows a summary of those specifications alongside the layout document, before the signature canvas

### Requirement: Pre-measurement disclaimer shows the actual deposit amount paid
The pre-measurement disclaimer form (`PRE_MEASUREMENT_DISCLAIMER` signature at `CLOSED_AWAITING_MEASUREMENT`) SHALL display the deposit amount that has been recorded (consultant's share + measurer's share) when a tier-1 payment milestone exists for the order. This amount SHALL be displayed as an explicit acknowledgement that the customer has paid a deposit which will be deducted from the final payment, replacing any reference to a fixed "20%" fraction.

#### Scenario: Customer sees deposit amount in disclaimer form
- **WHEN** a customer opens the pre-measurement disclaimer signing screen and the consultant has already recorded the measurement payment
- **THEN** the form shows a green "אישור תשלום מקדמה" block with the exact amount (consultant + measurer combined) and a note that it will be deducted from the final invoice

#### Scenario: No deposit recorded yet
- **WHEN** a customer opens the pre-measurement disclaimer signing screen but no tier-1 milestone has been recorded
- **THEN** the deposit block is not shown; the customer signs only the measurement disclaimer text
