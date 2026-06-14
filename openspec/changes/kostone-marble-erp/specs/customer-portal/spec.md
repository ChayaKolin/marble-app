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
