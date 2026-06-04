# Kostone Marble — Technical Specification

## 1. Database Schema (PostgreSQL)

### users
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- username VARCHAR(50) UNIQUE NOT NULL
- password_hash VARCHAR(255) NOT NULL
- role VARCHAR(30) NOT NULL
- full_name VARCHAR(100) NOT NULL
- phone_number VARCHAR(20) NOT NULL
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### customers
- id UUID PRIMARY KEY
- full_name VARCHAR(150) NOT NULL
- phone_number VARCHAR(20) NOT NULL
- email VARCHAR(100) UNIQUE NOT NULL
- address TEXT NOT NULL
- architect_name VARCHAR(150)
- architect_phone VARCHAR(20)
- created_by UUID REFERENCES users(id)

### orders
- id UUID PRIMARY KEY
- customer_id UUID REFERENCES customers(id)
- status VARCHAR(50) NOT NULL
- elevator_size VARCHAR(50)
- crane_required BOOLEAN DEFAULT FALSE
- sla_deadline TIMESTAMP
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### material_specs
- id UUID PRIMARY KEY
- order_id UUID REFERENCES orders(id)
- marble_model VARCHAR(100) NOT NULL
- finish_type VARCHAR(50) NOT NULL
- square_meters NUMERIC(10,2) NOT NULL
- edge_thickness VARCHAR(50) NOT NULL
- water_grooves BOOLEAN DEFAULT FALSE
- sink_brand VARCHAR(100)
- sink_model VARCHAR(100)
- sink_mounting VARCHAR(50)
- cooktop_base_fee NUMERIC(10,2) DEFAULT 200.00

### payments
- id UUID PRIMARY KEY
- order_id UUID REFERENCES orders(id)
- payment_type VARCHAR(50) NOT NULL
- amount NUMERIC(15,2) NOT NULL
- method VARCHAR(50) NOT NULL
- status VARCHAR(30) DEFAULT 'PENDING'
- recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### signatures
- id UUID PRIMARY KEY
- order_id UUID REFERENCES orders(id)
- signature_type VARCHAR(50) NOT NULL
- signature_payload TEXT NOT NULL
- signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 2. API Endpoints

- `POST /api/v1/auth/otp-send`
- `POST /api/v1/auth/otp-verify`
- `POST /api/v1/customers`
- `GET /api/v1/analytics/financial-trends`
- `PUT /api/v1/settings/toggle-manager-financials`
- `POST /api/v1/orders/{id}/payments`
- `PUT /api/v1/orders/{id}/field-measurements`
- `POST /api/v1/orders/{id}/slab-layouts`
- `POST /api/v1/orders/{id}/client-signoff`

## 3. Security Rules

- Only `ROLE_SUPER_ADMIN` can access financial metrics unless a manager toggle is enabled.
- All state transitions are enforced server-side.
- Payment milestone checks are required before moving orders into production or completion.

## 4. Deployment Checklist

- Host frontend, backend, and Postgres on Railway.
- Use Flyway or Liquibase migrations in `src/main/resources/db/migration`.
- Required environment variables:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `JWT_SIGNING_KEY`
  - `APP_SECURITY_ALLOW_MANAGER_ANALYTICS=false`
  - `SYSTEM_ADMIN_EMAIL=kostonemarble@gmail.com`
  - `AWS_S3_ACCESS_KEY`
  - `AWS_S3_SECRET_KEY`
  - `AWS_S3_BUCKET_NAME`
