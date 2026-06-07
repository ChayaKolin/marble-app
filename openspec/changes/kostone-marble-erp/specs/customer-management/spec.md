## ADDED Requirements

### Requirement: Customer profile requires a complete site address
The system SHALL require `site_address`, `site_city` on every customer record. `site_floor` and `site_apt` are optional. The Consultant SHALL NOT be able to save a customer profile without the mandatory address fields.

#### Scenario: Customer created with full address
- **WHEN** the Consultant submits a new customer profile with all mandatory fields including `site_address` and `site_city`
- **THEN** the customer record is persisted and the site address becomes the default for all future orders

#### Scenario: Customer creation fails without address
- **WHEN** the Consultant submits a new customer profile with `site_address` empty
- **THEN** the system returns HTTP 400 and the customer is not created

### Requirement: Creating a customer leads straight into creating and viewing their order
Once the Consultant successfully saves a new customer profile, the system SHALL close the "add customer" form and immediately open the "new order" form with that customer pre-selected, so the Consultant can proceed straight to placing the order without having to locate the customer again in the list. Once that order is created, the system SHALL navigate the Consultant directly to that order's detail page (instead of back to the customer list), so they land on its details immediately and can continue working the deal (e.g. closing it and booking the measurement).

#### Scenario: New order flow opens right after saving the customer
- **WHEN** the Consultant submits the "add customer" form and the customer is created successfully
- **THEN** the "add customer" form closes and the "new order" form opens with the new customer already selected and their site details shown

#### Scenario: Order detail page opens right after creating the order
- **WHEN** the Consultant submits the "new order" form and the order is created successfully
- **THEN** the "new order" form closes and the Consultant lands directly on that order's detail page showing its details

### Requirement: Customers are soft-deleted, never hard-deleted
The system SHALL set `deleted_at = NOW()` when the Consultant deletes a customer. The system SHALL NOT issue a SQL `DELETE` against the `customers` table. Soft-deleted customers SHALL be hidden from all standard UI views and API list responses.

#### Scenario: Customer soft-deleted
- **WHEN** the Consultant deletes a customer
- **THEN** the customer's `deleted_at` is stamped with the current timestamp and the customer disappears from the main customer list

#### Scenario: Soft-deleted customer restored
- **WHEN** the Consultant opens the Trash view and restores a soft-deleted customer
- **THEN** `deleted_at` is set to `NULL` and the customer reappears in the main list

#### Scenario: Hard delete attempt blocked
- **WHEN** the application layer attempts to issue a SQL DELETE on the customers table
- **THEN** the database FK RESTRICT constraints prevent deletion if any orders reference that customer

### Requirement: Consultant can send and resend portal invites to customers
The system SHALL allow the Consultant to trigger a magic-link portal invite for any customer at any time via `POST /api/v1/portal/auth/request`. Sending a new invite SHALL invalidate any previous unused token for that customer.

#### Scenario: Portal invite sent
- **WHEN** the Consultant sends a portal invite for a customer with a valid email address
- **THEN** the customer receives an email with a magic-link valid for 24 hours
