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

### Requirement: Installer's daily job list exposes the job-completion action
For `INSTALLATION` and `SITE_VISIT` calendar events, `GET /api/v1/calendar/events` SHALL expose `logisticsAssignmentId` (the linked `logistics_assignments.id`) and `logisticsCompleted` (its `is_completed` flag) to the Installer. The Installer's daily job list SHALL use these fields to offer a "סיום עבודה — חתימת לקוח" (finish job — customer signature) action on jobs not yet completed, which opens the mandatory `FINAL_POST_INSTALLATION` signature capture (see digital-signatures spec). Once a job is marked complete, the daily list SHALL show it as done instead of the action button.

#### Scenario: Installer sees the finish-job action on an incomplete job
- **WHEN** the Installer views today's job list and a job's logistics assignment is not yet completed
- **THEN** a "סיום עבודה — חתימת לקוח" button is shown for that job

#### Scenario: Completed job shows confirmation instead of the action
- **WHEN** the Installer successfully completes the signature flow for a job
- **THEN** the job list shows a confirmation that the job is done and the remaining balance may be collected, and the action button is no longer shown

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

### Requirement: Measurers are managed via a roster the Consultant selects from when booking an appointment
The system SHALL maintain a roster of measurers, each with a first name, an optional last name, and a phone number (`measurers` table, soft-deletable, `last_name` nullable). The Consultant SHALL be able to list the active roster (`GET /api/v1/measurers`) and add a new measurer to it (`POST /api/v1/measurers`), both restricted to the Consultant role. First name and phone number are required (`@NotBlank`, phone number a 10-digit Israeli number) — last name is optional. When booking the measurement appointment while closing the deal, the Consultant SHALL choose a measurer from this roster — selection is required before the appointment can be confirmed — with an inline option to add a new measurer to the roster and have it selected immediately without leaving the flow. The chosen measurer SHALL be linked to the resulting `MEASUREMENT` calendar event (`measurer_id`), and the event response SHALL expose the measurer's name (last name omitted if not set) and phone number to all authorized calendar viewers (Consultant and Factory Manager).

#### Scenario: Consultant selects an existing measurer when booking the appointment
- **WHEN** the Consultant closes the deal and picks a measurer from the roster dropdown along with a date and start time
- **THEN** the `MEASUREMENT` calendar event is created with that measurer linked, and the calendar/side-panel display the measurer's name and phone number alongside the appointment

#### Scenario: Consultant adds a new measurer inline while booking
- **WHEN** the Consultant cannot find the desired measurer in the roster and uses the "add measurer" option to enter a first name and phone number (last name optional)
- **THEN** a new measurer is created in the roster, immediately selected for the appointment being booked, and available for selection on future appointments without re-entry

#### Scenario: Adding a measurer without a last name
- **WHEN** the Consultant adds a new measurer with only a first name and phone number, leaving the last name blank
- **THEN** the measurer is created successfully with `lastName = null`, and is displayed (in the roster dropdown and on calendar events) by first name alone

#### Scenario: Booking is blocked without a selected measurer
- **WHEN** the Consultant attempts to close the deal and book the measurement appointment without selecting (or adding) a measurer
- **THEN** the system does not create the calendar event or advance the order status, and prompts the Consultant to choose a measurer first

### Requirement: New installers can be added inline when assigning a logistics job
When assigning an installer on the order detail "workflow" tab (step 5 — שיבוץ מתקין), the Consultant SHALL be able to pick from the existing installer list (`GET /api/v1/auth/users/installers`) or add a new installer inline (`POST /api/v1/auth/users/installers`) without leaving the flow. The "add installer" form SHALL collect first name, last name, and phone number, of which first name and phone number are required (`@NotBlank`, phone number a 10-digit Israeli number) — last name is optional. On success the new installer SHALL be added to the list and immediately selected for the assignment being made. The endpoint SHALL be restricted to the Consultant role (`ROLE_SUPER_ADMIN_OWNER`) and SHALL create the installer as an internal user with `role = INSTALLER` (with a system-generated unique username and password hash, since installer login provisioning is a separate concern).

#### Scenario: Consultant adds a new installer inline while assigning logistics
- **WHEN** the Consultant cannot find the desired installer in the list on step 5 and uses the "+ הוסף מתקין" option to enter a first name and phone number (last name optional)
- **THEN** a new installer is created with `role = INSTALLER`, immediately selected for the logistics assignment being made, and available for selection on future assignments without re-entry

#### Scenario: Adding an installer without a first name or phone number is rejected
- **WHEN** the Consultant submits the "add installer" form without a first name or without a valid 10-digit phone number
- **THEN** the system rejects the submission with a message indicating first name and phone number are required, and no installer is created
