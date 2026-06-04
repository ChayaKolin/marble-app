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
