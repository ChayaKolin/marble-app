## ADDED Requirements

### Requirement: All financial values use BigDecimal precision
The system SHALL use `java.math.BigDecimal` for all financial amounts, dimensional measurements, and square-meter values. Floating-point primitives (`float`, `double`) SHALL NOT be used in any financial or dimensional calculation. An ArchUnit rule SHALL enforce this at build time.

#### Scenario: Financial calculation precision
- **WHEN** a 20% deposit is calculated on a total of 15,750 NIS
- **THEN** the result is exactly 3,150.00 NIS with no floating-point rounding error

### Requirement: 20% deposit gates transition to CLOSED_AWAITING_MEASUREMENT
The system SHALL block the order from advancing to `CLOSED_AWAITING_MEASUREMENT` until a `financial_ledger` record with `milestone_tier = 1` and `is_cleared = TRUE` exists, where `amount_allocated` equals at least 20.00% of `orders.total_gross_amount`.

#### Scenario: Deposit gate blocks transition
- **WHEN** no cleared milestone-1 ledger record exists for an order in QUOTATION status
- **THEN** any attempt to advance the order is rejected with HTTP 409

#### Scenario: Deposit gate allows transition
- **WHEN** a cleared milestone-1 record exists for exactly 20% of the gross amount
- **THEN** the order may advance to `CLOSED_AWAITING_MEASUREMENT`

### Requirement: 80% balance is confirmed by Consultant to complete the order
The system SHALL require the Consultant to confirm an 80% balance payment (milestone_tier = 2) before marking an order `COMPLETED`. The Installer's job completion action does not itself close the order.

#### Scenario: Order completion requires payment confirmation
- **WHEN** the Consultant attempts to move an order to `COMPLETED`
- **THEN** the system checks for a cleared milestone-2 record before allowing the transition

#### Scenario: Installer completes job without closing order
- **WHEN** an Installer marks their logistics assignment as complete
- **THEN** the order status does not automatically change; the Consultant must separately confirm the 80% payment to advance to COMPLETED

### Requirement: Financial data is hidden from Hotman by default
The system SHALL hide all financial amounts, revenue charts, and payment milestone data from the Factory Manager role unless `VIEW_ANALYTICS` or `VIEW_FINANCIAL_CHARTS` permissions are explicitly granted by the Consultant.

#### Scenario: Hotman sees no financial data
- **WHEN** a Factory Manager user accesses the system without financial permissions
- **THEN** no NIS amounts, revenue totals, or payment statuses are visible anywhere in their UI
