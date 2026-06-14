## ADDED Requirements

### Requirement: All notification content is in Hebrew
Every outbound notification — email subject, email body, WhatsApp message — SHALL be written entirely in Hebrew. No English text SHALL appear in customer-facing or installer-facing communications.

#### Scenario: Installer dispatch notification
- **WHEN** Hotman assigns an installer to an order
- **THEN** the installer receives a Hebrew WhatsApp message with the job date, customer name, and site address

### Requirement: Key workflow events trigger automatic notifications
The system SHALL send automatic notifications on the following events:

| Event | Recipient | Channel |
|---|---|---|
| Measurements uploaded | Hotman | WhatsApp + in-app |
| Layout ready for customer review | Customer | Email + WhatsApp |
| Customer signs layout | Consultant | Email |
| Installer dispatched | Installer | WhatsApp |
| Job marked complete by installer | Consultant | Email |

#### Scenario: Customer notified when layout is ready
- **WHEN** Hotman uploads the layout plan for an order in REVIEWING_LAYOUT status
- **THEN** the customer receives a Hebrew email and WhatsApp message containing a fresh one-time portal magic-link (the same mechanism as `POST /api/v1/portal/auth/request`); clicking it signs the customer in directly and shows the layout-approval signature action

#### Scenario: Consultant can share the layout-ready link manually
- **WHEN** Hotman or the Consultant uploads the layout plan via `POST /api/v1/orders/{id}/layout`
- **THEN** the response includes the same portal magic-link sent to the customer, so it can be copied and shared manually (e.g. when running with the stub notification adapter in local development)

#### Scenario: Hotman notified on measurement upload
- **WHEN** field measurements are uploaded for an order
- **THEN** Hotman receives a Hebrew WhatsApp notification indicating the order is ready for layout drafting

### Requirement: WhatsApp delivery uses Twilio with fallback to email
The system SHALL deliver WhatsApp messages via the Twilio WhatsApp API using the `users.phone_number` field as the target. If WhatsApp delivery fails, the system SHALL fall back to email where an address is available.

#### Scenario: WhatsApp delivery fails — email fallback
- **WHEN** a Twilio WhatsApp delivery returns a non-success status
- **THEN** the system attempts email delivery and logs the WhatsApp failure

### Requirement: Email delivery is independent of Twilio configuration
The real notification adapter SHALL activate whenever **either** Twilio (`twilio.account-sid`) **or** Gmail SMTP (`spring.mail.password`) is configured — not only when both are present. When Twilio is not configured but Gmail SMTP is, email-based notifications (magic links, layout-ready, job-complete, etc.) SHALL be delivered via real Gmail SMTP, while WhatsApp-bound messages SHALL skip the Twilio attempt and fall back to email (or, where no recipient email is available, log a warning so the Consultant can share the portal link manually) instead of failing the request.

#### Scenario: Gmail configured without Twilio
- **WHEN** `KOSTONE_EMAIL_PASSWORD` (Gmail SMTP) is set but `TWILIO_ACCOUNT_SID` is empty
- **THEN** email notifications (e.g. the customer portal magic-link, layout-ready notice) are sent via real Gmail SMTP, and WhatsApp-channel requests fall back to email or a manual-share link without raising an error

#### Scenario: Neither Twilio nor Gmail configured (local dev default)
- **WHEN** neither `TWILIO_ACCOUNT_SID` nor `KOSTONE_EMAIL_PASSWORD` is set
- **THEN** the stub adapter logs all notification content and the Consultant shares portal links manually, as before

### Requirement: Notification delivery failures never fail the triggering operation
SMTP and WhatsApp delivery errors (e.g. connection timeouts, provider outages) SHALL be caught at the adapter level, logged, and reported as a `false` delivery result — never thrown as exceptions that would roll back or fail the calling business operation.

#### Scenario: SMTP connection fails during magic-link request
- **WHEN** `POST /api/v1/portal/auth/request` is called but the SMTP server connection times out
- **THEN** the magic-link token is still persisted and returned to the Consultant (HTTP 200, `delivered: false`) rather than the request failing with HTTP 500

#### Scenario: SMTP connection fails during layout upload
- **WHEN** Hotman uploads the layout plan via `POST /api/v1/orders/{id}/layout` but the customer-notification email fails to send
- **THEN** the layout upload itself completes successfully and the response still includes the portal magic-link for manual sharing

### Requirement: Notifications use pre-approved Hebrew templates for WhatsApp Business
All outbound WhatsApp messages SHALL use Twilio-approved Hebrew message templates to comply with WhatsApp Business API requirements.

#### Scenario: Template message sent
- **WHEN** the system sends an installer dispatch WhatsApp message
- **THEN** the message matches an approved template with the job date and address filled in as template variables
