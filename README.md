# Marble App — Kostone ERP

A full-stack ERP system for marble and stone fabrication businesses. Manages the complete order lifecycle from quotation through installation, with role-based access for office staff, factory managers, installers, and customers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.3.5, Spring Security, Spring Data JPA |
| Database | PostgreSQL + Flyway migrations |
| Authentication | JWT (internal) + magic-link (customer portal) |
| Notifications | Gmail SMTP + Twilio WhatsApp |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| HTTP Client | Axios |
| Charts | Recharts |
| Deployment | Railway |

---

## Project Structure

```
marble-app/
├── backend/          # Spring Boot REST API (port 8080)
├── frontend/         # React + Vite SPA (port 5173)
├── .env.example      # Required environment variables
└── DEPLOY.md         # Production deployment checklist
```

---

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 18+
- PostgreSQL (local or remote)

### 1. Environment variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```env
# PostgreSQL
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/kostonemarble_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password

# Email (Gmail app password)
KOSTONE_SYSTEM_EMAIL=your@gmail.com
KOSTONE_EMAIL_PASSWORD=your_app_password

# JWT — generate with: openssl rand -hex 32
JWT_SIGNING_KEY=your_64_char_hex_key

# Twilio WhatsApp (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# App URLs
BASE_URL=http://localhost:5173
UPLOAD_DIR=/tmp/uploads
PORT=8080
```

### 2. Run the backend

```bash
cd backend
mvn spring-boot:run
```

Flyway migrations run automatically on startup. The API is available at `http://localhost:8080`.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app is available at `http://localhost:5173`.

---

## User Roles

| Role | Hebrew Name | Access |
|---|---|---|
| `SUPER_ADMIN_OWNER` | Consultant | Full access — orders, customers, analytics, permissions |
| `FACTORY_MANAGER` | Hotman | Factory view — blueprints, production queue, calendar |
| `INSTALLER` | Installer | Mobile view — daily assignments, signature capture |
| Customer | Portal | Passwordless magic-link — view own orders, sign documents |

Seed users are created by `V2__seed_users.sql` on first startup.

---

## Order Lifecycle

```
QUOTATION
  └─> CLOSED_AWAITING_MEASUREMENT
        └─> REVIEWING_LAYOUT          (requires pre-measurement signature)
              └─> PRODUCTION          (requires slab layout approval signature)
                    └─> AWAITING_INSTALLATION
                          ├─> PENDING_REPAIR
                          └─> COMPLETED
                                └─> ARCHIVED
```

---

## Key Features

- **Order management** — full lifecycle tracking with document uploads (layouts, blueprints, photos)
- **Digital signatures** — canvas-based capture for pre-measurement disclaimer, layout approval, and post-installation sign-off
- **Customer portal** — passwordless access via email or WhatsApp magic-link
- **Notifications** — email (SMTP) and WhatsApp (Twilio) for order updates and portal links
- **Financial ledger** — payment milestone tracking (20% deposit, 80% on installation)
- **Analytics dashboard** — monthly revenue, installer performance, historical comparisons
- **Calendar & logistics** — installation scheduling shared across roles
- **Hebrew UI** — full RTL interface in Hebrew

---

## Running Tests

```bash
cd backend
mvn test
```

Tests use an H2 in-memory database configured in `application-test.properties`.

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the full Railway deployment checklist.

The app is designed for Railway with a PostgreSQL plugin. Set all environment variables from `.env.example` in the Railway service dashboard.
