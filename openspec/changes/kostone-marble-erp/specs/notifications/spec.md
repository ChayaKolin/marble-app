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
- **THEN** the customer receives a Hebrew email and WhatsApp message with a link to their portal to review and sign

#### Scenario: Hotman notified on measurement upload
- **WHEN** field measurements are uploaded for an order
- **THEN** Hotman receives a Hebrew WhatsApp notification indicating the order is ready for layout drafting

### Requirement: WhatsApp delivery uses Twilio with fallback to email
The system SHALL deliver WhatsApp messages via the Twilio WhatsApp API using the `users.phone_number` field as the target. If WhatsApp delivery fails, the system SHALL fall back to email where an address is available.

#### Scenario: WhatsApp delivery fails — email fallback
- **WHEN** a Twilio WhatsApp delivery returns a non-success status
- **THEN** the system attempts email delivery and logs the WhatsApp failure

### Requirement: Notifications use pre-approved Hebrew templates for WhatsApp Business
All outbound WhatsApp messages SHALL use Twilio-approved Hebrew message templates to comply with WhatsApp Business API requirements.

#### Scenario: Template message sent
- **WHEN** the system sends an installer dispatch WhatsApp message
- **THEN** the message matches an approved template with the job date and address filled in as template variables
