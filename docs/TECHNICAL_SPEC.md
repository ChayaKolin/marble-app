# Kostone Marble — Technical Specification

## 5. Granular Database Schema (PostgreSQL)

Primary tables, keys, and constraints. Use `UUID` primary keys and `gen_random_uuid()` default.

### Table: `users`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `username` VARCHAR(50) UNIQUE NOT NULL
- `password_hash` VARCHAR(255) NOT NULL (BCrypt)
- `role` VARCHAR(30) NOT NULL (SUPER_ADMIN, FACTORY_MANAGER, INSTALLER, CUSTOMER)
- `full_name` VARCHAR(100) NOT NULL
- `phone_number` VARCHAR(20) NOT NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Table: `customers`
- `id` UUID PRIMARY KEY
- `full_name` VARCHAR(150) NOT NULL
- `phone_number` VARCHAR(20) NOT NULL
- `email` VARCHAR(100) UNIQUE NOT NULL
- `address` TEXT NOT NULL
- `architect_name` VARCHAR(150) NULL
- `architect_phone` VARCHAR(20) NULL
- `created_by` UUID REFERENCES users(id)

### Table: `orders`
- `id` UUID PRIMARY KEY
- `customer_id` UUID REFERENCES customers(id)
- `status` VARCHAR(50) NOT NULL (AWAITING_DEPOSIT, MEASUREMENT, LAYOUT_APPROVAL, PRODUCTION, INSTALLED, COMPLETED)
- `elevator_size` VARCHAR(50) NULL
- `crane_required` BOOLEAN DEFAULT FALSE
- `sla_deadline` TIMESTAMP NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Table: `material_specs`
- `id` UUID PRIMARY KEY
- `order_id` UUID REFERENCES orders(id)
- `marble_model` VARCHAR(100) NOT NULL
- `finish_type` VARCHAR(50) NOT NULL
- `square_meters` NUMERIC(10,2) NOT NULL
- `edge_thickness` VARCHAR(50) NOT NULL
- `water_grooves` BOOLEAN DEFAULT FALSE
- `sink_brand` VARCHAR(100)
- `sink_model` VARCHAR(100)
- `sink_mounting` VARCHAR(50)
- `cooktop_base_fee` NUMERIC(10,2) DEFAULT 200.00

### Table: `payments`
- `id` UUID PRIMARY KEY
- `order_id` UUID REFERENCES orders(id)
- `payment_type` VARCHAR(50) NOT NULL (DEPOSIT_20_PERCENT, BALANCE_80_PERCENT)
- `amount` NUMERIC(15,2) NOT NULL
- `method` VARCHAR(50) NOT NULL (CASH, CHECK, CARD, TRANSFER)
- `status` VARCHAR(30) DEFAULT 'PENDING'
- `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Table: `signatures`
- `id` UUID PRIMARY KEY
- `order_id` UUID REFERENCES orders(id)
- `signature_type` VARCHAR(50) NOT NULL (PRE_MEASUREMENT, SLAB_LAYOUT, COMPLETION)
- `signature_payload` TEXT NOT NULL (Base64 PNG or S3 URL)
- `signed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 6. API Interface Definitions (OpenAPI 3.0 - summary)

Authentication and role checks:
- OTP-based passwordless login for customers (phone/email) with JWT issuance.
- All analytics and financial endpoints require SUPER_ADMIN, unless manager access is toggled.

Core endpoints (summary):
- `POST /api/v1/auth/otp-send` — send OTP to phone/email.
- `POST /api/v1/auth/otp-verify` — verify OTP and return JWT.
- `POST /api/v1/customers` — create customer (Owner only).
- `GET /api/v1/analytics/financial-trends` — return revenue/profit trends (Owner-only unless toggled).
- `PUT /api/v1/settings/toggle-manager-financials` — toggle manager access (Owner only).
- `POST /api/v1/orders/{id}/payments` — log DEPOSIT or BALANCE payments.
- `PUT /api/v1/orders/{id}/field-measurements` — upload laser measurement files; recalculates `square_meters`.
- `POST /api/v1/orders/{id}/slab-layouts` — Hotman uploads layout; sets status to `LAYOUT_APPROVAL`.
- `POST /api/v1/orders/{id}/client-signoff` — client submits digital signature; moves to `PRODUCTION`.

Security notes:
- Validate role on every controller/service layer entry.
- Enforce payment milestone checks in the domain/service layer (do not rely on client checks).

## 7. Project State Machine & Business Rules

- Strict state transitions enforced in backend service layer.
- Payment milestones block transitions (e.g., cannot schedule measurement or fabrication before 20% deposit).
- Installers cannot mark completion unless 80% verified for the order.

## 8. Cloud Deployment Checklist (Railway)

Environment variables (example):
- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` — provided by Railway Postgres attachment.
- `JWT_SIGNING_KEY` — server secret for tokens.
- `APP_SECURITY_ALLOW_MANAGER_ANALYTICS` — default `false`.
- `SYSTEM_ADMIN_EMAIL=kostonemarble@gmail.com`.
- `AWS_S3_ACCESS_KEY`, `AWS_S3_SECRET_KEY`, `AWS_S3_BUCKET_NAME` — for object storage.

Migrations:
- Use Flyway or Liquibase with scripts in `src/main/resources/db/migration`.
- Railway runs migrations on each deploy after GitHub push.

---
If you want, I can:
- Generate a Flyway SQL migration for the above schema.
- Produce an OpenAPI YAML scaffold for these endpoints.
- Create an implementation backlog and milestones.
