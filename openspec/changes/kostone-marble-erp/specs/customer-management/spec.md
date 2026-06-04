## ADDED Requirements

### Requirement: Customer profile requires a complete site address
The system SHALL require `site_address`, `site_city` on every customer record. `site_floor` and `site_apt` are optional. The Consultant SHALL NOT be able to save a customer profile without the mandatory address fields.

#### Scenario: Customer created with full address
- **WHEN** the Consultant submits a new customer profile with all mandatory fields including `site_address` and `site_city`
- **THEN** the customer record is persisted and the site address becomes the default for all future orders

#### Scenario: Customer creation fails without address
- **WHEN** the Consultant submits a new customer profile with `site_address` empty
- **THEN** the system returns HTTP 400 and the customer is not created

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
