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

### Requirement: Installer login is scoped to mobile interface
The system SHALL restrict Installer-role JWT sessions to the `/installer/*` route namespace. Installers SHALL NOT be able to access financial, analytics, factory, or full calendar modules.

#### Scenario: Installer login renders mobile view
- **WHEN** an Installer logs in
- **THEN** the system renders only the personal daily calendar list, job detail view, and optional signature capture screen
