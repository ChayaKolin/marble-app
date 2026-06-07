## ADDED Requirements

### Requirement: Order address inherits from customer and can be overridden
When an order is created, the system SHALL pre-populate the order's address fields from the linked customer's `site_address`, `site_city`, `site_floor`, and `site_apt`. The Consultant MAY override any address field at the order level. A `NULL` order-level address field SHALL resolve to the customer's corresponding field. The effective address SHALL be computed as `COALESCE(orders.site_*, customers.site_*)`.

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
In addition to adding material specifications later from an order's "specs" tab, the Consultant SHALL have the option to fill in marble/stone details (model code, finish type, square meters, counter-edge detailing, water-edge requirement, cooktop base fee) directly in the new-order form. When such details are provided, the system SHALL create the order first and then attach the material specification to the newly created order in the same flow.

#### Scenario: Marble details supplied while creating the order
- **WHEN** the Consultant fills in the optional marble-details section (at minimum, model/code and square meters) while creating a new order and submits the form
- **THEN** the order is created and a material specification with the supplied details is attached to it immediately, visible in the order's "specs" tab without any extra steps

#### Scenario: Marble details left for later
- **WHEN** the Consultant creates a new order without filling in the optional marble-details section
- **THEN** the order is created with no material specification, and the Consultant can still add one later from the order's "specs" tab
