## ADDED Requirements

### Requirement: Calendar access is role-differentiated without a toggle for view access
The system SHALL grant calendar read access to both Consultant and Factory Manager roles by default, enforced at the role level. The Factory Manager SHALL NOT require a permission toggle to view the calendar. The Installer SHALL see only events where `assigned_to_user_id` matches their own user ID.

#### Scenario: Hotman views calendar without permission toggle
- **WHEN** a Factory Manager logs in
- **THEN** the full installation calendar is visible in read-only mode with no additional permission required

#### Scenario: Installer sees only their own jobs
- **WHEN** an Installer opens the calendar
- **THEN** only events assigned to their user ID are shown; no other installers' events are visible

### Requirement: Only Consultant can create, edit, or delete calendar events by default
The system SHALL restrict calendar write operations (`POST`, `PUT`, `DELETE` on `/api/v1/calendar/events`) to users with `SUPER_ADMIN_OWNER` role OR the `MANAGE_CALENDAR` permission. By default only the Consultant passes this check.

#### Scenario: Consultant creates an event
- **WHEN** the Consultant creates a new calendar event
- **THEN** the event is persisted and appears on all authorized role views

#### Scenario: Hotman cannot create events by default
- **WHEN** a Factory Manager (without MANAGE_CALENDAR) attempts to create a calendar event
- **THEN** the system returns HTTP 403

#### Scenario: MANAGE_CALENDAR toggle unlocks Hotman write access
- **WHEN** the Consultant grants the MANAGE_CALENDAR permission to the Factory Manager
- **THEN** the Factory Manager can create, edit, and delete calendar events without any code change

### Requirement: INSTALLATION events are auto-generated from logistics assignments
The system SHALL automatically create a `calendar_events` row of type `INSTALLATION` (or `SITE_VISIT` for return visits) whenever a `logistics_assignments` row is inserted. Manual creation of these event types by the Consultant is also allowed.

#### Scenario: Auto-event created on dispatch
- **WHEN** Hotman saves a new logistics assignment
- **THEN** a calendar event of the appropriate type appears on the calendar immediately

### Requirement: Calendar event detail panel is filtered by role
The system SHALL show customer name, effective delivery address, floor/apt, installer assigned, order status, elevator/access notes to all authorized viewers. Financial data (outstanding payment balance, order notes) SHALL be visible to the Consultant only.

#### Scenario: Hotman opens event detail
- **WHEN** the Factory Manager clicks an installation event
- **THEN** the side panel shows operational details but no payment balance or financial figures

### Requirement: Closing the deal requires booking a 4-hour measurer arrival window on the calendar
When the Consultant closes the deal and advances an order from `QUOTATION` to `CLOSED_AWAITING_MEASUREMENT`, the system SHALL require choosing a date and a start time for the measurer's visit, and SHALL automatically compute the end of a fixed 4-hour arrival window (`endTime = startTime + 4h`). The system SHALL create a `MEASUREMENT` calendar event linked to that order (`relatedOrderId`) with the chosen `eventDate`, `startTime`, and the computed `endTime`, so both the Consultant and the Factory Manager can see on the shared calendar during which 4-hour window the measurer will visit which customer.

#### Scenario: Measurement appointment booked as a 4-hour window when closing the deal
- **WHEN** the Consultant closes the deal on a `QUOTATION` order, picks a date and a start time (e.g. 09:00) for the measurer, and confirms
- **THEN** the order advances to `CLOSED_AWAITING_MEASUREMENT`, a `MEASUREMENT` calendar event for that order appears on the calendar spanning the chosen date from the start time through start time + 4 hours (e.g. 09:00–13:00), and the Consultant sees the computed arrival window displayed before confirming

#### Scenario: Hotman sees the measurement appointment window
- **WHEN** the Factory Manager opens the calendar after a measurement appointment has been booked
- **THEN** the `MEASUREMENT` event is visible with the customer name, address, and the scheduled 4-hour arrival window (start and end time, without financial figures)

#### Scenario: Closing the deal is blocked without a chosen date and start time
- **WHEN** the Consultant attempts to close the deal without selecting both a date and a start time for the measurer's arrival window
- **THEN** the system does not advance the order status and prompts the Consultant to choose both
