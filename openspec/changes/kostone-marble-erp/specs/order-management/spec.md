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
The system SHALL set `deleted_at = NOW()` when the Consultant deletes an order. Soft-deleted orders SHALL be hidden from all standard order list views. The Consultant SHALL be able to restore a soft-deleted order from the Trash view. Deletion is permitted at any point up until the customer has digitally approved the slab layout (the `SLAB_LAYOUT_APPROVAL` signature in `digital_signatures`) — once that signature exists (the order is in or past `PRODUCTION`), the order can no longer be deleted. The order detail view SHALL offer a "delete order" action with a confirmation dialog whenever deletion is permitted, regardless of which status (`QUOTATION`, `CLOSED_AWAITING_MEASUREMENT`, or `REVIEWING_LAYOUT` before signature) the order is currently in. The confirmation dialog SHALL include an optional free-text "reason for deletion" field; if filled in, the reason SHALL be recorded in the activity log alongside the deletion event (see the data-safety "Activity log" requirement).

#### Scenario: Order soft-deleted
- **WHEN** the Consultant deletes an order that has not yet had its slab layout approved by the customer, after confirming in the dialog (optionally entering a reason)
- **THEN** `deleted_at` is stamped, the order is removed from the active order list, and an `ORDER_DELETED` activity log entry is recorded with the optional reason

#### Scenario: Order restored from Trash
- **WHEN** the Consultant restores a soft-deleted order
- **THEN** `deleted_at` is set to `NULL` and the order reappears in the active order list with its previous status intact

#### Scenario: Deletion blocked once the customer has approved the layout
- **WHEN** the Consultant attempts to delete an order for which a `SLAB_LAYOUT_APPROVAL` signature already exists
- **THEN** the system rejects the request with `409 Conflict` and the order is not deleted

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
The system SHALL prevent the Consultant from sending the customer a request to review and digitally sign the detailed proposal (`POST /api/v1/portal/auth/request` from the order's "send to customer" step) until the proposal is complete: at least one marble/material specification exists on the order (`specs.length > 0`) AND the order has a known total amount (`totalGrossAmount` is not `null`). The send action (button and channel selector) SHALL be disabled while either condition is unmet, and the UI SHALL clearly list which of the two conditions is still missing so the Consultant knows exactly what to complete first. Because the order's "specs" tab holds two distinct kinds of items — marble/stone material specifications and sink specifications — under one combined count, any message about a missing specification SHALL explicitly name "marble/stone specification" (and the required sub-fields, model/code and square meters) and explicitly note that it is distinct from a sink entry, so the Consultant cannot mistake "I added a sink" for "the proposal is complete."

#### Scenario: Send blocked — no marble specification yet
- **WHEN** the Consultant reaches the "send detailed proposal" step on an order that has no material specification yet (even if one or more sinks have been added)
- **THEN** the send button is disabled and the system shows a message naming the missing item as a marble/stone specification (model/code and square meters, in the "marble and stone" sub-tab) — distinct from a sink — so the Consultant is not confused about which kind of item is still missing

#### Scenario: Send blocked — amount not yet set
- **WHEN** the Consultant reaches the "send detailed proposal" step on an order whose `totalGrossAmount` is still `null`
- **THEN** the send button is disabled and the system shows a message indicating that a clear total amount must be set first

#### Scenario: Send allowed once the proposal is complete
- **WHEN** the order has at least one material specification and a non-null `totalGrossAmount`
- **THEN** the send button is enabled and the Consultant can request the customer's review and digital signature on the full, priced proposal

### Requirement: Sink specifications support a quantity and free-text notes
Each sink specification entry SHALL have a `quantity INT NOT NULL DEFAULT 1` and an optional `notes TEXT` field. This allows the Consultant to record a single entry for multiple identical sinks (e.g. a matching pair — one for dairy use, one for meat use — entered as quantity 2) instead of duplicating the entry, and to capture free-text remarks (e.g. installation preferences) per sink entry. The sink specification form in the order's "specs" / sinks sub-tab SHALL include a quantity number input (default 1) and a notes text input. Existing sink entries SHALL display their quantity (when greater than 1) and notes (when present).

#### Scenario: Sink added with quantity greater than one
- **WHEN** the Consultant adds a sink specification and sets quantity to 2
- **THEN** the sink entry is saved with `quantity = 2` and the order's sinks list displays "× 2" alongside that entry

#### Scenario: Sink added with a note
- **WHEN** the Consultant fills in the notes field while adding a sink specification
- **THEN** the note is persisted and displayed on that sink entry's card

#### Scenario: Sink added without specifying quantity
- **WHEN** the Consultant adds a sink specification without changing the quantity field
- **THEN** the sink entry is saved with `quantity = 1` and no "× N" indicator is shown

### Requirement: Marble/material specifications support free-text notes
Each marble/material specification entry SHALL have an optional `notes TEXT` field, mirroring the sink specification's notes field, to capture free-text remarks (e.g. slab selection preferences, special cutting instructions) per material entry. The marble/stone specification form in the order's "specs" / marble sub-tab SHALL include a notes text input. Existing marble/stone entries SHALL display their notes (when present), and the notes field SHALL also be included in the proposal preview and the customer portal's quotation/proposal views alongside the other material specification details.

#### Scenario: Marble/stone specification added with a note
- **WHEN** the Consultant fills in the notes field while the marble-spec form's required fields ("סוג / קוד שיש" and "שטח (מ\"ר)") are also filled in
- **THEN** the specification is saved with the note included, and the note is displayed on that entry's card in the "specs" tab and in the proposal preview

#### Scenario: Marble/stone specification added without a note
- **WHEN** the Consultant adds a marble/stone specification without filling in the notes field
- **THEN** the specification is saved with no notes, and no note line is shown on that entry's card

### Requirement: Marble/material specification submissions are validated with precise error messages
Whenever a marble/material specification is saved — automatically from the "specs" tab's "marble and stone" sub-tab form once its required fields are filled in, or from the new-order form's optional marble section — both the frontend and the backend SHALL validate "סוג / קוד שיש" (model/code, non-blank) and "שטח (מ\"ר)" (square meters, a number greater than 0) before saving. If "עלות כיריים" (cooktop base fee) is supplied it SHALL be a non-negative number (zero is allowed, meaning no cooktop cutout). On failure the system SHALL return a specific message naming the invalid field and the reason (e.g. "שטח (מ\"ר) חייב להיות גדול מ-0"), rather than a generic save-failure message. Any other unexpected server-side error SHALL be returned as a real `500` with a message, rather than allowed to fall through to the default error-dispatch path that resets the security context and surfaces as a misleading `401` (auto-logout).

#### Scenario: Square meters left blank or non-numeric
- **WHEN** the Consultant submits the marble-spec form with an empty or non-numeric "שטח (מ\"ר)" value
- **THEN** the system rejects the submission with a message stating that "שטח (מ\"ר)" must be a valid number, and no specification row is created

#### Scenario: Square meters is zero or negative
- **WHEN** the Consultant submits the marble-spec form with "שטח (מ\"ר)" equal to 0 or a negative number
- **THEN** the system rejects the submission with a message stating that "שטח (מ\"ר)" must be greater than 0

#### Scenario: Marble model/code left blank
- **WHEN** the Consultant submits the marble-spec form without a "סוג / קוד שיש" value
- **THEN** the system rejects the submission with a message stating that "סוג / קוד שיש" is required

#### Scenario: Unexpected server error does not log the Consultant out
- **WHEN** an unhandled exception occurs while processing a request from an authenticated user
- **THEN** the system returns a `500` response with an error message, and the Consultant's session remains valid for subsequent requests (no forced logout)

### Requirement: Required fields are marked and form entries save automatically
On the order detail "workflow" tab, the "סכום כולל" (total gross amount) field and all other fields required to advance the order or send the quote to the customer SHALL be marked with a trailing `*` in their label or placeholder. The total amount input SHALL be saved automatically when the Consultant moves focus away from the field (`onBlur`), without requiring a separate "עדכן סכום" click; the explicit button remains available for the same action.

On the "specs" tab, the marble/stone specification form and the sink specification form SHALL NOT have an explicit "add" button. Once a form's required fields are filled in (model/code and a square-meters value greater than 0 for marble/stone; brand and model for sinks), the system SHALL automatically save the new specification a short moment after the Consultant stops changing the form, then clear the form so the Consultant can enter the next item. If the "send to customer" completeness gate is blocking on a missing marble/stone specification or total amount, and the Consultant has already filled in the corresponding form fields, the gate SHALL show an additional hint indicating that the entry will be saved automatically.

#### Scenario: Total amount saves on blur
- **WHEN** the Consultant types a valid amount into the "סכום כולל" field on the workflow tab and clicks elsewhere on the page
- **THEN** the amount is saved via `PUT /api/v1/orders/{id}` without the Consultant needing to click "עדכן סכום"

#### Scenario: Marble/stone specification saves automatically
- **WHEN** the Consultant fills in "סוג / קוד שיש" and a "שטח (מ\"ר)" greater than 0 in the marble-spec form and pauses without clicking any button
- **THEN** the specification is saved via `POST /api/v1/orders/{id}/materials`, the new item appears in the marble/stone list, and the form is cleared for the next entry

#### Scenario: Sink specification saves automatically
- **WHEN** the Consultant fills in "מותג" and "דגם" in the sink-spec form and pauses without clicking any button
- **THEN** the sink specification is saved via `POST /api/v1/orders/{id}/sinks`, the new item appears in the sinks list, and the form is cleared for the next entry

#### Scenario: Completeness gate hints at unsaved marble-spec form data
- **WHEN** the "send to customer" gate is shown because no marble/stone specification exists yet, and the Consultant has filled in valid "סוג / קוד שיש" and "שטח (מ\"ר)" values in the marble-spec form
- **THEN** the gate message additionally indicates that the filled-in fields will be saved automatically momentarily

### Requirement: Consultant can preview the proposal before sending it to the customer
On the "REVIEWING_LAYOUT" step of the order detail "workflow" tab, a "תצוגה מקדימה של ההצעה" (proposal preview) toggle SHALL be available above the send-channel selector and "שלח הצעה" button. When expanded, it SHALL show a read-only summary of everything the customer's portal/proposal will reflect: the site address, the full list of marble/stone specifications (model/code, finish, square meters, edge detailing, water-edge flag, cooktop fee), the full list of sink specifications (brand, model, dimensions, color, mounting style, quantity, notes), the total amount with its 20%/80% payment breakdown (or a warning if not yet set), the crane disclaimer (`CRANE_DISCLAIMER_HE`, verbatim) if `craneRequired` is true, and whether a layout document has been uploaded. The preview SHALL reflect current in-memory state and require no additional API calls. Sending to the customer remains a separate, explicit action and is not triggered by opening the preview.

#### Scenario: Consultant reviews the proposal before sending
- **WHEN** the Consultant expands "תצוגה מקדימה של ההצעה" on the REVIEWING_LAYOUT step
- **THEN** the panel shows the site address, all marble/stone specs, all sinks, the total amount with its 20%/80% breakdown (or a warning that no amount is set), the crane disclaimer if the order requires a crane, and the layout-document upload status — without sending anything to the customer

### Requirement: Existing marble/stone and sink specification entries can be edited
On the "specs" tab, every existing marble/stone specification and sink specification entry SHALL have an "ערוך" (edit) button alongside its "מחק" (delete) button, available regardless of the order's status. Clicking "ערוך" SHALL replace that entry's card with an inline edit form pre-filled with its current values (mirroring the fields of the corresponding "add" form), with "שמור שינויים" (save) and "ביטול" (cancel) actions. Saving SHALL submit the updated fields via `PUT /api/v1/orders/{orderId}/materials/{specId}` (marble/stone) or `PUT /api/v1/orders/{orderId}/sinks/{sinkId}` (sinks), applying the same field validation as the corresponding "add" endpoint, update the entry in place in the specs list, and close the edit form. Cancelling SHALL discard any changes and close the edit form without calling the API. Both endpoints are restricted to the Consultant role (`ROLE_SUPER_ADMIN_OWNER`).

#### Scenario: Consultant edits a marble/stone specification
- **WHEN** the Consultant clicks "ערוך" on an existing marble/stone specification entry, changes a field (e.g. "שטח (מ\"ר)"), and clicks "שמור שינויים"
- **THEN** the entry is updated via `PUT /api/v1/orders/{orderId}/materials/{specId}`, the specs list reflects the new value, and the edit form closes

#### Scenario: Consultant edits a sink specification
- **WHEN** the Consultant clicks "ערוך" on an existing sink specification entry, changes a field (e.g. "צבע"), and clicks "שמור שינויים"
- **THEN** the entry is updated via `PUT /api/v1/orders/{orderId}/sinks/{sinkId}`, the sinks list reflects the new value, and the edit form closes

#### Scenario: Consultant cancels an in-progress edit
- **WHEN** the Consultant clicks "ערוך" on a specification entry, changes a field, then clicks "ביטול"
- **THEN** no API call is made, the entry's displayed values remain unchanged, and the static card is shown again

#### Scenario: Editing a marble/stone specification with invalid values is rejected
- **WHEN** the Consultant edits a marble/stone specification and clears "סוג / קוד שיש" or sets "שטח (מ\"ר)" to 0 or less, then clicks "שמור שינויים"
- **THEN** the system rejects the update with the same field-specific error messages as the "add" form, and the entry is not modified

### Requirement: The customer reviews the order's specification before signing the layout approval
At the `REVIEWING_LAYOUT` step, the customer portal's layout-approval screen SHALL display a summary of the order's specification — every marble/stone specification (model/code, finish, square meters, edge detailing, water-edge flag, cooktop fee, notes) and every sink specification (brand, model, dimensions, color, mounting style, quantity, notes) — alongside the layout document preview, so the customer can review exactly what was ordered before signing `SLAB_LAYOUT_APPROVAL`. This is informational only and does not change the signature gate on `REVIEWING_LAYOUT → PRODUCTION`.

#### Scenario: Customer sees the specification before signing the layout approval
- **WHEN** the customer opens the layout-approval screen for an order in `REVIEWING_LAYOUT`
- **THEN** the screen shows the order's marble/stone and sink specifications above or alongside the layout document, before the signature canvas is shown
