## ADDED Requirements

### Requirement: Hotman uploads cutting layout and triggers customer review
When an order is in `REVIEWING_LAYOUT`, the Factory Manager SHALL be able to upload the cutting/slab layout document (תוכנית פריסה). On upload, the system SHALL notify the customer via their portal and email/WhatsApp that their layout is ready for review and signature.

#### Scenario: Layout uploaded by Hotman
- **WHEN** Hotman uploads a layout PDF for an order in REVIEWING_LAYOUT status
- **THEN** the document is attached to the order and the customer receives a Hebrew notification with a portal link

### Requirement: SLA production timer starts on PRODUCTION transition
When an order transitions to `PRODUCTION`, the system SHALL initiate an SLA countdown based on `orders.factory_sla_deadline`. The decrementing timer SHALL be displayed on Hotman's SLA Alert Deck, color-coded by urgency.

#### Scenario: SLA timer visible on Hotman dashboard
- **WHEN** an order enters PRODUCTION status
- **THEN** a production card appears on Hotman's SLA Alert Deck showing the remaining hours until `factory_sla_deadline`, color-coded (green → yellow → red as deadline approaches)

#### Scenario: SLA deadline exceeded
- **WHEN** the current time passes `factory_sla_deadline` for an order in PRODUCTION
- **THEN** the production card is displayed in red and flagged as overdue

### Requirement: Installer dispatch creates a calendar event automatically
When Hotman creates a `logistics_assignment`, the system SHALL automatically create a linked `calendar_events` row. The event type SHALL be `INSTALLATION` if `is_primary = TRUE`, or `SITE_VISIT` if `is_primary = FALSE`.

#### Scenario: Primary assignment creates INSTALLATION event
- **WHEN** Hotman dispatches an installer for the first time on an order (is_primary = TRUE)
- **THEN** an INSTALLATION calendar event is auto-created with the delivery date, installer name, and order reference

#### Scenario: Return visit creates SITE_VISIT event
- **WHEN** a new logistics assignment is created with is_primary = FALSE for a PENDING_REPAIR order
- **THEN** a SITE_VISIT calendar event is auto-created

### Requirement: Return visits are tracked as separate logistics assignments
An order MAY have multiple `logistics_assignments`. The first assignment SHALL have `is_primary = TRUE`. All subsequent assignments SHALL have `is_primary = FALSE` and represent return visits or repairs. Only the primary assignment's completion triggers the 80% payment flow.

#### Scenario: Return visit assignment created
- **WHEN** an order moves to PENDING_REPAIR and a new logistics assignment is created
- **THEN** the assignment is persisted with is_primary = FALSE and a SITE_VISIT calendar event is generated

#### Scenario: Return visit does not trigger payment
- **WHEN** an Installer marks a return-visit (is_primary = FALSE) assignment as complete
- **THEN** no 80% payment milestone event is triggered; the Consultant handles completion separately
