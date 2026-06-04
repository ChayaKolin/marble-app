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
