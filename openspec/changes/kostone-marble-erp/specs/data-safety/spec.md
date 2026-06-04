## ADDED Requirements

### Requirement: Orders and customers are soft-deleted with deleted_at timestamp
The system SHALL implement soft delete on `orders` and `customers` using a `deleted_at TIMESTAMP WITH TIME ZONE` column. `NULL` means active; non-NULL means soft-deleted. The application layer SHALL NEVER issue `DELETE FROM orders` or `DELETE FROM customers`. All standard queries SHALL include `WHERE deleted_at IS NULL`.

#### Scenario: Record soft-deleted
- **WHEN** the Consultant deletes an order or customer
- **THEN** `deleted_at` is set to the current timestamp and the record disappears from all standard list views

#### Scenario: Soft-deleted record restored
- **WHEN** the Consultant opens the Trash view and restores a record
- **THEN** `deleted_at` is set to `NULL` and the record reappears in the active list with all data intact

#### Scenario: Hard delete blocked at DB level
- **WHEN** any process attempts a SQL DELETE on orders where child records exist in material_specifications, financial_ledger, or digital_signatures
- **THEN** the database raises a foreign key violation due to ON DELETE RESTRICT

### Requirement: Child tables of orders use ON DELETE RESTRICT
The following foreign key relationships SHALL use `ON DELETE RESTRICT` to prevent accidental cascading deletion of order data: `material_specifications.order_id`, `sink_specifications.order_id`, `logistics_assignments.order_id`, `financial_ledger.order_id`, `digital_signatures.order_id`.

#### Scenario: Child record prevents order deletion
- **WHEN** a direct SQL DELETE is attempted on an order that has material specifications
- **THEN** the database returns a foreign key constraint error and the order is not deleted

### Requirement: Production database has automated daily backups with 30-day retention
The Railway.com PostgreSQL instance SHALL have daily automated snapshots enabled. Snapshots SHALL be retained for a minimum of 30 days. Backup success/failure notifications SHALL be sent to `kostonemarble@gmail.com`. Soft-deleted records SHALL be included in all backups.

#### Scenario: Daily backup completes
- **WHEN** the daily backup job runs
- **THEN** a full database snapshot is stored and retained for at least 30 days

#### Scenario: Backup failure notified
- **WHEN** a backup job fails
- **THEN** an alert is sent to `kostonemarble@gmail.com` within 1 hour

### Requirement: Consultant has a Trash view to browse and restore deleted records
The Consultant dashboard SHALL include a dedicated Trash section listing all soft-deleted orders and customers with their deletion timestamp. Each record SHALL have a Restore button.

#### Scenario: Trash view accessible to Consultant only
- **WHEN** the Consultant opens the Trash view
- **THEN** all soft-deleted orders and customers are listed with their deleted_at date and a restore action

#### Scenario: Trash view inaccessible to other roles
- **WHEN** a Factory Manager or Installer attempts to access the Trash view
- **THEN** the system returns HTTP 403
