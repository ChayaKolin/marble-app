## ADDED Requirements

### Requirement: Internal users authenticate with username and password
The system SHALL authenticate Consultant, Hotman, and Installer users with a username and password combination. On success the system SHALL return a stateless JWT containing `sub` (user ID), `role`, and `granted_features[]`. The JWT SHALL be re-issued at every login to reflect current permission state.

#### Scenario: Successful internal login
- **WHEN** a user submits valid username and password to `POST /api/v1/auth/login`
- **THEN** the system returns a signed JWT with `role` and current `granted_features[]` encoded in the claims

#### Scenario: Invalid credentials
- **WHEN** a user submits an incorrect username or password
- **THEN** the system returns HTTP 401 with no detail on which field was wrong

### Requirement: Role determines UI shell and API access
The system SHALL render a role-specific UI shell based on the JWT `role` claim. The system SHALL enforce role guards on all API endpoints via Spring Security `@PreAuthorize`.

#### Scenario: Installer accesses Consultant route
- **WHEN** an authenticated Installer attempts to access a Consultant-only API endpoint
- **THEN** the system returns HTTP 403 and the frontend redirects to the Installer's dashboard

#### Scenario: Correct shell rendered
- **WHEN** a Factory Manager logs in
- **THEN** the frontend renders the Hotman shell: SLA Alert Deck, Blueprints Panel, and Calendar Preview Strip — not the Analytics Dashboard

### Requirement: The "Kostone Marble" logo in the dashboard header returns to the default tab
In each role's dashboard shell (Consultant, Factory Manager), the "Kostone Marble" logo in the top-right corner of the header SHALL act as a "go home" button: it switches the active tab back to that role's default tab (Consultant: "לקוחות" / customers; Factory Manager: "לוח SLA" / sla) and discards any in-progress nested view (e.g. an open order detail), restoring that tab to the same state it has immediately after login — regardless of which tab is currently active or what is open within it.

#### Scenario: Logo click returns Consultant to the default tab
- **WHEN** the Consultant is viewing any tab (e.g. "לוח שנה", "פח אשפה") and clicks the "Kostone Marble" logo in the header
- **THEN** the dashboard switches to the "לקוחות" (customers) tab showing the full customer list

#### Scenario: Logo click closes an open order and returns to the customer list
- **WHEN** the Consultant has an order detail view open (reached by clicking into a customer's order from the "לקוחות" tab) and clicks the "Kostone Marble" logo
- **THEN** the order detail view closes without prompting, and the Consultant sees the full customer list — the same as right after login

#### Scenario: Logo click returns Factory Manager to the default tab
- **WHEN** the Factory Manager is viewing the calendar tab and clicks the "Kostone Marble — מפעל" logo in the header
- **THEN** the dashboard switches to the "לוח SLA" tab

### Requirement: Customer authenticates via magic-link only
The system SHALL never create or store a password for Customer-role users. Authentication SHALL use a one-time token delivered via email or WhatsApp. On successful verification the system SHALL issue a 7-day JWT with `role: CUSTOMER` and `sub: customer_id`.

#### Scenario: Magic-link request sent
- **WHEN** the Consultant calls `POST /api/v1/portal/auth/request` with a valid customer ID and channel
- **THEN** the system generates a 32-byte random token, stores its SHA-256 hash in `customer_portal_tokens`, and delivers the plain token to the customer via the specified channel

#### Scenario: Token verification succeeds
- **WHEN** a customer calls `GET /api/v1/portal/auth/verify?token=<plain_token>` with a valid, unexpired, unused token
- **THEN** the system marks the token as used (`used_at = NOW()`) and returns a signed 7-day JWT

#### Scenario: Expired token rejected
- **WHEN** a customer submits a token whose `expires_at` has passed
- **THEN** the system returns HTTP 401 with no indication of whether the token existed

#### Scenario: Already-used token rejected
- **WHEN** a customer submits a token that has already been used (`used_at IS NOT NULL`)
- **THEN** the system returns HTTP 401

#### Scenario: Re-invite invalidates previous token
- **WHEN** the Consultant sends a new portal invite for a customer who already has an unused token
- **THEN** the previous unused token is invalidated (`used_at` stamped) before the new token is created

### Requirement: Customer portal sessions never collide with an internal user's session in the same browser
The frontend SHALL store the internal-user JWT and the customer-portal JWT under separate `localStorage` keys (`token` and `portal_token` respectively) and SHALL select which one to attach to the `Authorization` header based on the active route: requests made while on `/portal/*` SHALL use `portal_token`, and all other requests SHALL use `token`. This SHALL hold even when both tokens are present in the same browser (e.g. a Consultant opens a customer's magic link in the same browser tab/session where they are logged in). On a `401` response, only the session corresponding to the active route SHALL be cleared and redirected: a `/portal/*` 401 SHALL clear `portal_token` and redirect to `/portal/auth` (shown as an expired/invalid-link message), while a non-portal `401` SHALL clear the internal session and redirect to `/login`.

#### Scenario: Consultant opens a customer's magic link while logged in
- **WHEN** a Consultant, while logged in to their own dashboard, opens a customer portal magic link (`/portal/auth?token=...`) in the same browser
- **THEN** the portal verify call and all subsequent `/api/v1/portal/**` calls use the customer JWT (`portal_token`), not the Consultant's internal JWT, and the customer portal loads normally

#### Scenario: Expired or invalid portal session redirects within the portal
- **WHEN** a request from `/portal/*` returns `401` (e.g. an expired `portal_token`)
- **THEN** only `portal_token` is cleared and the browser is redirected to `/portal/auth`, without affecting or clearing any internal-user session in the same browser

### Requirement: Installer login is scoped to mobile interface
The system SHALL restrict Installer-role JWT sessions to the `/installer/*` route namespace. Installers SHALL NOT be able to access financial, analytics, factory, or full calendar modules.

#### Scenario: Installer login renders mobile view
- **WHEN** an Installer logs in
- **THEN** the system renders only the personal daily calendar list, job detail view, and optional signature capture screen
