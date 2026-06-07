## ADDED Requirements

### Requirement: Order address inherits from customer and can be overridden
When an order is created, the system SHALL pre-populate the order's address fields from the linked customer's `site_address`, `site_city`, `site_floor`, and `site_apt`. The Consultant MAY override any address field at the order level. A `NULL` order-level address field SHALL resolve to the customer's corresponding field. The effective address SHALL be computed as `COALESCE(orders.site_*, customers.site_*)`. As with the customer profile, the `site_city` override SHALL be chosen from the predefined list of Israeli cities via a searchable selection (typing filters the list of suggestions; arbitrary free text cannot be stored) — see the customer-management "City fields are restricted to a predefined list" requirement.

#### Scenario: Order created — address inherited
- **WHEN** the Consultant creates a new order for a customer
- **THEN** the order form pre-fills with the customer's site address; no override fields are set

#### Scenario: Order address overridden
- **WHEN** the Consultant edits the delivery address on an order to a different street
- **THEN** the override value is stored on the order and used as the effective address for that order only; the customer's default address is unchanged

#### Scenario: Installer sees effective address
- **WHEN** an Installer views their assigned job on the mobile calendar
- **THEN** the displayed address is the order-level override if set, otherwise the customer's default address

### Requirement: Orders support a free-text notes field
Every order SHALL have a `notes TEXT` field for general internal notes. The Consultant SHALL be able to create and update order notes at any time. Notes SHALL be visible to the Consultant in the order detail view and on the calendar event side panel.

#### Scenario: Order note saved
- **WHEN** the Consultant types a note on an order and saves
- **THEN** the note is persisted and displayed in the order detail and calendar side panel

### Requirement: Orders are soft-deleted, never hard-deleted
The system SHALL set `deleted_at = NOW()` when the Consultant deletes an order. Soft-deleted orders SHALL be hidden from all standard order list views. The Consultant SHALL be able to restore a soft-deleted order from the Trash view.

#### Scenario: Order soft-deleted
- **WHEN** the Consultant deletes an order
- **THEN** `deleted_at` is stamped and the order is removed from the active order list

#### Scenario: Order restored from Trash
- **WHEN** the Consultant restores a soft-deleted order
- **THEN** `deleted_at` is set to `NULL` and the order reappears in the active order list with its previous status intact

### Requirement: Order stores logistics access constraints
The order SHALL store `elevator_width_meters`, `elevator_height_meters`, and `crane_required` flag. These fields SHALL be displayed on the calendar event side panel for the Installer. A crane disclaimer SHALL appear on all customer-facing documents: "שירותי מנוף אינם כלולים במחיר הפרויקט ומאורגנים ומומנים על חשבון הלקוח בלעדית."

#### Scenario: Crane disclaimer on invoice
- **WHEN** any customer-facing document (invoice, quote, contract) is generated
- **THEN** the crane disclaimer appears prominently on the document
### Requirement: A customer may have at most one open order at a time
The system SHALL refuse to create a new order for a customer that already has an open order (an order with `deleted_at IS NULL` and `status` not in `COMPLETED` or `ARCHIVED`). The customer list SHALL surface the customer's open order directly: when a customer has an open order, the "add order" action SHALL be replaced with an "active order" action that navigates the Consultant straight to that order's detail view.

#### Scenario: Duplicate open order rejected
- **WHEN** the Consultant attempts to create a new order for a customer who already has an order that is not `COMPLETED`, `ARCHIVED`, or soft-deleted
- **THEN** the system returns HTTP 409 with a message indicating the customer already has an open order

#### Scenario: Order allowed once the previous one is closed
- **WHEN** the Consultant creates an order for a customer whose only previous order is `COMPLETED` or `ARCHIVED` (or soft-deleted)
- **THEN** the new order is created normally

#### Scenario: Customer list links directly to the open order
- **WHEN** the Consultant views the customer list and a customer has an open order
- **THEN** an "active order" button appears on that customer's row instead of the "add order" button, and clicking it opens that order's detail view directly

#### Scenario: Customer picker on the "new order" form excludes customers with an open order
- **WHEN** the Consultant opens the "new order" form's customer selector
- **THEN** the list only offers customers who do not currently have an open order, so the Consultant cannot even attempt to start a duplicate order from that form

### Requirement: Submitting the "new order" form navigates straight to the created order's detail page
When the Consultant submits the "new order" form (whether opened from the orders list's "הזמנה חדשה" / "צור הזמנה ראשונה" actions or from a customer row's "+ הזמנה" action) and the order is created successfully, the system SHALL close the form and take the Consultant directly to that order's detail view — not back to the orders list — so they can continue filling in details (amount, address overrides, marble specification, logistics, etc.) right away.

#### Scenario: New order opens its own detail page after creation
- **WHEN** the Consultant fills in the "new order" form and submits it successfully
- **THEN** the form closes and the order detail view for the newly created order opens immediately, without an intermediate trip back to the orders list

### Requirement: The total order amount is optional until the on-site measurement determines it
The system SHALL NOT require a `totalGrossAmount` when an order is created or edited, because the final amount is typically only known after the measurer's on-site visit (exact square meters, finishes, etc.). `total_gross_amount` SHALL be a nullable column, and `CreateOrderRequest` SHALL accept a `null`/absent amount. The Consultant SHALL be able to set or update the amount at any later point (e.g., after measurement) via the order's detail view, which calls the order update endpoint (`PUT /api/v1/orders/{id}`) supporting partial updates of `notes` and/or `totalGrossAmount`. Any feature that derives a figure from `totalGrossAmount` (e.g., the measurer's 20% fee) SHALL treat a missing amount as "not yet available" and prompt the Consultant to set it first rather than computing against zero or null.

#### Scenario: Order created without an amount
- **WHEN** the Consultant creates a new order and leaves the total amount field empty
- **THEN** the order is created successfully with `totalGrossAmount` set to `null`, and the order list/detail views show "amount not yet set" instead of a figure

#### Scenario: Consultant sets the amount after measurement
- **WHEN** the Consultant opens an order whose amount is still unset and enters a total amount with the "update amount" action
- **THEN** the order's `totalGrossAmount` is updated and figures derived from it (such as the measurer's 20% fee) become available

#### Scenario: Measurer-fee actions are blocked until the amount is known
- **WHEN** the Consultant reaches the measurer-payment step of an order whose `totalGrossAmount` is still `null`
- **THEN** the system shows a prompt to set the order's total amount first and does not allow recording a measurer payment computed against a missing amount

### Requirement: Marble (stone) specifications can be added at order-creation time
In addition to adding material specifications later from an order's "specs" tab, the Consultant SHALL have the option to fill in marble/stone details (model code, finish type, square meters, counter-edge detailing, water-edge requirement, cooktop base fee) directly in the new-order form. When such details are provided, the system SHALL create the order first and then attach the material specification to the newly created order in the same flow. The model/code and square-meters fields are both required for the specification to be saved — the system SHALL NOT silently discard a partially filled-in marble section, and SHALL NOT report the order itself as failed to create when only the attached specification could not be saved.

#### Scenario: Marble details supplied while creating the order
- **WHEN** the Consultant fills in the optional marble-details section (at minimum, model/code and square meters) while creating a new order and submits the form
- **THEN** the order is created and a material specification with the supplied details is attached to it immediately, visible in the order's "specs" tab without any extra steps

#### Scenario: Marble details left for later
- **WHEN** the Consultant creates a new order without filling in the optional marble-details section
- **THEN** the order is created with no material specification, and the Consultant can still add one later from the order's "specs" tab

#### Scenario: Partially filled marble section is rejected before submission
- **WHEN** the Consultant fills in only the model/code or only the square-meters field of the optional marble-details section (but not both) and submits the new-order form
- **THEN** the system blocks submission with a message explaining that both fields are required for the specification to be saved (or that both should be left empty to add it later), and does not create the order until this is resolved

#### Scenario: Order is preserved even if attaching the specification fails
- **WHEN** the order itself is created successfully but the subsequent request to attach the supplied material specification fails
- **THEN** the system still takes the Consultant to the new order's detail page (instead of showing a misleading "order creation failed" error), so they can add the specification from the order's "specs" tab without losing the order they just created

### Requirement: The customer may only be sent the proposal for approval once it is complete
The system SHALL prevent the Consultant from sending the customer a request to review and digitally sign the detailed proposal (`POST /api/v1/portal/auth/request` from the order's "send to customer" step) until the proposal is complete: at least one marble/material specification exists on the order (`specs.length > 0`) AND the order has a known total amount (`totalGrossAmount` is not `null`). The send action (button and channel selector) SHALL be disabled while either condition is unmet, and the UI SHALL clearly list which of the two conditions is still missing so the Consultant knows exactly what to complete first.

#### Scenario: Send blocked — no marble specification yet
- **WHEN** the Consultant reaches the "send detailed proposal" step on an order that has no material specification yet
- **THEN** the send button is disabled and the system shows a message indicating that marble/stone details must be added first

#### Scenario: Send blocked — amount not yet set
- **WHEN** the Consultant reaches the "send detailed proposal" step on an order whose `totalGrossAmount` is still `null`
- **THEN** the send button is disabled and the system shows a message indicating that a clear total amount must be set first

#### Scenario: Send allowed once the proposal is complete
- **WHEN** the order has at least one material specification and a non-null `totalGrossAmount`
- **THEN** the send button is enabled and the Consultant can request the customer's review and digital signature on the full, priced proposal
