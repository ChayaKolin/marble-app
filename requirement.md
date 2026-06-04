Here is your completely updated, comprehensive, enterprise-grade Product Requirements Document (PRD). It is fully tailored to **Kostone Marble**, configured with your official email (`kostonemarble@gmail.com`), and explicitly details the updated hierarchical role structures (Super-Admin vs. Secondary Admin), client dashboard analytics, and customer portal views.

You can save the contents of this block directly as your **`requirement.md`** file in your project directory.

```markdown
# Product Requirement Document (PRD) & Technical Specification
## System Name: Kostone Marble Enterprise Order Management (ERP)
## Default System Email: kostonemarble@gmail.com

---

## 1. Executive Summary & Business Goals
Kostone Marble ERP is a highly specialized, niche-specific Enterprise Resource Planning and Order Management system designed exclusively for high-end residential and commercial marble and stone fabrication businesses. The platform guarantees end-to-end operation tracing, from initial client intake to final post-installation verification. 

The application enforces a rigorous milestone-based workflow ensuring zero technical data dropouts between field measurements, factory layout cutting (תוכנית פריסה), and on-site delivery, while locking fiscal progression parameters to prevent unauthorized financial exposure.

---

## 2. User Roles, Hierarchy, & Access Control (RBAC)

The system operates on an explicit hierarchical permission matrix, dividing administrative control dynamically.

### 2.1 Role 1: Super-Admin / Owner (The Consultant / Your Husband)
*   **System Status:** Primary Master User.
*   **Permissions:** Complete global read/write/delete privileges across all datasets.
*   **Core Capabilities:**
    *   Create, edit, archive, and manage all Customer Accounts and Architect profiles.
    *   Initialize, update, override, or cancel any Order Lifecycle state.
    *   Unrestricted access to the **Master Analytics & Business Intelligence Dashboard** (detailed monthly summaries, historical revenue comparison, margin tracking, installer performance graphs).
    *   **Permission Delegation Control:** The only user capable of toggling specific feature visibility/permissions for secondary roles (e.g., granting or revoking Hotman’s metrics access).

### 2.2 Role 2: Factory Manager (Hotman)
*   **System Status:** Secondary Admin User.
*   **Permissions:** Operational scoped control. Bound to factory, cutting, logistics, and scheduling modules.
*   **Core Capabilities:**
    *   Review client measurement layout schemas.
    *   Generate and upload custom cutting/slab layout blueprints (תוכנית פריסה).
    *   Input explicit production commitment timelines and track SLA metrics.
    *   Assign specific delivery dates and dispatch designated Installers.
    *   **Analytics Constraints:** By default, hidden from advanced financial analytics, monthly margin charts, and gross business metrics. Access to these charts must be explicitly unlocked via a feature flag controlled solely by the Super-Admin.

### 2.3 Role 3: The Installer
*   **System Status:** Field Mobile Agent.
*   **Permissions:** Single-record execution scope via a mobile-optimized interface.
*   **Core Capabilities:**
    *   View dedicated, assigned daily calendar routing with specific project addresses, customer contacts, and technical requirements.
    *   Capture real-time site adjustments or visual deviations via notes.
    *   Initiate on-screen Signature Canvas components for instant digital customer sign-off post-installation.

### 2.4 Role 4: The Customer
*   **System Status:** External Portal User.
*   **Authentication:** Secure, passwordless magic-link authentication or encrypted credentials routed via Email (`kostonemarble@gmail.com`) or WhatsApp.
*   **Core Capabilities:**
    *   Access a localized, secure personal portal to view specific Order Details, real-time status tracking, and payment history.
    *   Review and digitally sign the Pre-Measurement Acknowledgement and the crucial final Slab Layout Plan (תוכנית פריסה).

---

## 3. Key Business Modules & Conditional Workflow Logic


```

[Lead Input / Client Added]
│
▼
[Awaiting 20% Financial Deposit] ──(Blocks Access)──► [Measurement Stage Locked]
│
▼ (Paid & Logged via BigDecimal)
[Unlock Measurement Stage] ──► [Upload Field Measurements] ──► [Notify Hotman (Factory)]
│
▼
[Customer Slab Layout Approval] ◄──(Blocks Production)─── [Hotman Uploads Custom Layout]
│
▼ (Signed via HTML5 Canvas)
[SLA Production Timer Engaged] ──► [Logistics / Installer Dispatched]
│
▼
[Project Completion & Archive] ◄──(Requires 80% Payment)── [On-Site Client Sign-Off]

```

### 3.1 Intake, Project Files & Client Management
*   **Creation Engine:** Allows the Super-Admin to instantly create client profiles containing explicit fields: Customer Full Name, Primary Phone, Email Address, Site Location, Architect/Designer Name, and Architect Contact Info.
*   **Persistent Document Cloud:** Native support for high-resolution file attachments including original architectural blueprints, apartment layout photos, and technical specification sheets.

### 3.2 Technical Customization Metrics
The system logs highly granular data schemas with strict formatting rules:
*   **Stone Properties:** Material Type/Code, Finish Type (Glossy, Polished, Matte, Honed, Brushed), and exact Square Meters ($m^2$).
*   **Profile Detailing:** Detailed fields for Counter Edge Profiling (עיבוי קאנט) and Specialized Water Traps/Edges (קאנט מים).
*   **Sink Specifications:** Comprehensive matrix tracking Brand, Model Name, exact Sizing/Width dimensions, Colorway, and structural Mounting Profiles (Enum: `UNDERMOUNT`, `FLUSH_MOUNT`).
*   **Fixed Base Fees:** Automatic structural line-item injection for Cooktop Base Enclosures (הכנסה בסיס לסירים) locked at a immutable rate of **200 NIS** per installation unit.

### 3.3 Logistics Constraints & Cost Allocations
*   **Structural Flags:** Physical infrastructure fields mapping building access, including elevator dimensions, stairwell width anomalies, and parking proximity.
*   **Legal & Cost Exclusions:** The system must hard-code and visually append an omnipresent disclaimer across all customer-facing invoices, quotes, and contract sheets: 
    > **"Crane services (מנוף) are NOT included in the project pricing and are arranged and funded exclusively at the customer’s expense."**

### 3.4 Strict Financial Ledger Rules
*   All financial parameters use Java `BigDecimal` to enforce precise multi-currency decimal tracking without floating-point calculation drift.
*   **Milestone 1:** 20% Deposit. The system acts as a hard gate. The project state cannot transition to `MEASUREMENT_SCHEDULING` until exactly 20.00% of the calculated gross value is marked as paid in the ledger database.
*   **Milestone 2:** 80% Balance. This remaining sum is flagged as due upon the exact day of physical installation. The field installer's interface requires confirmation of payment intake or verification of payment prior to releasing digital completion screens.

### 3.5 Measurement & Layout Lifecycle Rules
*   **Pre-Measurement Gate:** Prior to triggering field actions, the Customer Portal displays a mandatory confirmation dialog: *"Final price, sizing, and specific details are determined exclusively AFTER professional field measurement."*
*   **Post-Measurement Blueprinting:** Field measurements are uploaded directly to the project directory, automatically alerting Hotman via a system notification event.
*   **The Cut-Sheet Gate (תוכנית פריסה):** Hotman maps the field measurements onto physical slab cuts and uploads the resulting Layout Document. The project status immediately enters `AWAITING_CUSTOMER_LAYOUT_SIGNATURE`. Production and fabrication are programmatically locked until an authenticated customer canvas signature event is written to the database.

### 3.6 SLA and Fulfillment Tracking
*   **Hotman Production SLA:** Upon customer layout approval, a strict, decrementing SLA timer initiates based on the specific calendar deadline committed by Hotman.
*   **Dispatch Assignment:** Tracks Installer Name, Phone Number, Vehicle ID, and planned Delivery Date.
*   **Field Handshake:** Post-installation, the Installer app triggers a signature canvas modal. The client must physically sign the device screen to close the order, validating receipt of work and verifying any real-time adjustments.

---

## 4. Master Analytics & Data Visualizations (Super-Admin Exclusive)

The Master Dashboard is explicitly optimized for executive review. It contains interactive data visualization layers built using highly responsive chart frameworks aligned with Claude Design styling paradigms.

### 4.1 Monthly Executive Summaries
*   **Gross Financial Yield:** Clear tracking of overall revenue generated per calendar month.
*   **Inflow vs. Receivables Pipeline:** Comparative bar charts showing actual money collected (20% deposits + completed 80% balances) against projected income locked in the pipeline (outstanding balances for orders currently in production or measurement phases).
*   **Material Volumetric Distribution:** Pie charts tracking the surface volume ($m^2$) processed per stone model/code to optimize factory raw-slab purchasing decisions.

### 4.2 Factory Throughput & Logistics Efficiency Metrics
*   **SLA Compliance Rates:** Time-series line charts tracking Hotman's actual production time against the initially committed factory SLA hours.
*   **Installer Quality Ratings:** Performance tracking lists indicating structural issue flags or notes recorded post-installation per installer team.

---

## 5. Granular Database Schema (PostgreSQL Relational Mapping)

```sql
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN_OWNER', 'FACTORY_MANAGER', 'INSTALLER');
CREATE TYPE order_status AS ENUM ('LEAD', 'AWAITING_DEPOSIT', 'MEASUREMENT_PHASE', 'LAYOUT_APPROVAL', 'PRODUCTION', 'LOGISTICS_DISPATCH', 'COMPLETED', 'ARCHIVED');
CREATE TYPE sink_mount_style AS ENUM ('UNDERMOUNT', 'FLUSH_MOUNT');
CREATE TYPE signature_category AS ENUM ('PRE_MEASUREMENT_DISCLAIMER', 'SLAB_LAYOUT_APPROVAL', 'FINAL_POST_INSTALLATION');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'INSTALLER',
    phone_number VARCHAR(30) NOT NULL,
    analytics_visible BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    email_address VARCHAR(150) NOT NULL,
    architect_name VARCHAR(150),
    architect_phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'LEAD',
    elevator_width_meters NUMERIC(4,2),
    elevator_height_meters NUMERIC(4,2),
    crane_required BOOLEAN NOT NULL DEFAULT FALSE,
    total_gross_amount NUMERIC(12,2) NOT NULL, -- Managed via strict BigDecimal
    factory_sla_deadline TIMESTAMP WITH TIME ZONE,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    marble_model_code VARCHAR(100) NOT NULL,
    finish_type VARCHAR(50) NOT NULL, -- e.g., 'Glossy', 'Polished'
    square_meters NUMERIC(6,2) NOT NULL, -- Managed via strict BigDecimal
    counter_edge_detailing VARCHAR(255), -- עיבוי קאנט
    water_edge_required BOOLEAN NOT NULL DEFAULT FALSE, -- קאנט מים
    cooktop_base_fee NUMERIC(6,2) NOT NULL DEFAULT 200.00
);

CREATE TABLE sink_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    width_mm INT NOT NULL,
    height_mm INT NOT NULL,
    depth_mm INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    mounting_style sink_mount_style NOT NULL DEFAULT 'UNDERMOUNT'
);

CREATE TABLE logistics_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    installer_user_id UUID NOT NULL REFERENCES users(id),
    delivery_scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    installer_notes TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    amount_allocated NUMERIC(12,2) NOT NULL,
    milestone_tier INT NOT NULL, -- 1 = 20% Deposit, 2 = 80% Balance
    is_cleared BOOLEAN NOT NULL DEFAULT FALSE,
    cleared_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    category signature_category NOT NULL,
    signature_vector_data TEXT NOT NULL, -- Encoded canvas coordinates or base64 blob
    ip_address VARCHAR(45),
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

```

---

## 6. Technical Stack & Architecture

### 6.1 Frontend (UI Layer)

* **Engine:** React 19 via Vite runtime compilation, typed via strict TypeScript.
* **Design Framework:** TailwindCSS combined with modular design architectures matching Claude Design specs. Highly responsive component layouts optimized for mobile field screens and widescreen analytics views.
* **Signatures:** HTML5 Canvas capture wrappers parsing interaction maps to compressed base64 payloads.

### 6.2 Backend (Service Layer)

* **Framework:** Java 21 / Spring Boot 3.x.
* **Data Accuracy Protection:** Code policies mandate `java.math.BigDecimal` for structural dimensions, metrics, costs, and fees. Floating-point primitives (`float`, `double`) are rejected by lint checkers.
* **Security:** State-tracking stateless JWT authentication filters reading permissions directly out of encoded claims vectors.
* **Notifications & Automation Engine:** Integrated Mail Sender profiles bound to the primary system address: **`kostonemarble@gmail.com`**. Automated systems convert layout templates into transactional PDFs and trigger outbound alerts via Twilio/WhatsApp API wrappers.

### 6.3 Database & Hosting

* **DB Engine:** Production PostgreSQL instance enforcing relational keys and transactional ACID safety boundaries.
* **Hosting Cloud:** Fully structured for deployment on **Railway.com**, leveraging native container buildpacks and persistent storage provisions for uploaded project assets and cut sheets.

---

## 7. OpenAPI 3.0 API Specification Snippet

```yaml
openapi: 3.0.3
info:
  title: Kostone Marble ERP API Engine
  version: 1.0.0
  description: Core backend service routing for Kostone Marble order management and factory systems.
paths:
  /api/v1/customers:
    post:
      summary: Add a new client account
      description: Accessible by Super-Admin (Your Husband) to create customer metadata profiles.
      operationId: createCustomer
      responses:
        '201':
          description: Customer record created successfully.
  /api/v1/logistics/assignments:
    get:
      summary: Fetch active logistics dispatch matrix
      description: Returns schedules, routing directions, and technical profiles for installers.
      responses:
        '200':
          description: Operational tracking matrix payload returned.
  /api/v1/installers/{id}/signoff:
    put:
      summary: Execute final job validation and closure
      description: Invoked by the Installer app to submit final on-site client signatures.
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - signatureData
              properties:
                signatureData:
                  type: string
                  description: Base64 or vector mapping coordinates of the client signature.
                installerNotes:
                  type: string
      responses:
        '200':
          description: Job verified, balance milestone marked, order status updated to COMPLETED.

```

---

## 8. UI Architecture & Screen Blueprint Layouts (Claude Design Model)

Following the modern design system foundations of Claude Design components, the layout emphasizes whitespace, crisp card groupings, distinct typography hierarchy, and a dark slate/neutral colorway accented by clean emerald details for financial clarity.

### 8.1 Master Analytics Screen (Super-Admin / Owner View Only)

* **Header Section:** Displays large, clean numeric indicators highlighting Monthly Total Revenue, Open Production Backlog count, and Total Outstanding Accounts Receivable.
* **Primary Section Left:** Interactive Chart Line plotting current month cash flow vs. historical month performance. Includes toggle overlays for target growth curves.
* **Primary Section Right:** Material Processing Table outlining exact stone models ($m^2$) sorted by processing volumes.
* **Hotman Visibility Toggle:** A persistent UI permission toggle button component allowing the Super-Admin to instantly grant/revoke the secondary manager's visibility over the financial analytics dashboard.

### 8.2 Factory Matrix View (Hotman View)

* **SLA Alert Deck:** Grid view displaying active production cards. Each card contains a decrementing colored progress timer indicating remaining hours before the committed cutting deadline expires.
* **Actionable Blueprints Panel:** Clean file upload container where Hotman can click to view field measurements and drag-and-drop compiled layout PDFs (תוכנית פריסה) for direct portal dispatch.

---

## 9. Railway.com Cloud Deployment Roadmap

### 9.1 Environment Variables Matrix Configuration

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<railway-provided-host>:<port>/kostonemarble_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=${{Postgres.POSTGRES_PASSWORD}}
KOSTONE_SYSTEM_EMAIL=kostonemarble@gmail.com
JWT_SIGNING_KEY=${{REVENUE_SECURITY_CIPHER_KEY}}
STORAGE_BUCKET_ENDPOINT=[https://storage.railway.app/kostonemarble-assets](https://storage.railway.app/kostonemarble-assets)

```

### 9.2 Build & Execution Blueprint (`Dockerfile`)

```dockerfile
# Multi-stage production container build pattern
FROM eclipse-temurin:21-jdk-jammy AS build-engine
WORKDIR /workspace
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
VOLUME /tmp
COPY --from=build-engine /workspace/target/*.jar app.jar
ENTRYPOINT ["java","-Dserver.port=${PORT}","-jar","/app.jar"]

```

### 9.3 Database Migration Flow

* All structural modifications must utilize Flyway migration files located inside the `/src/main/resources/db/migration` project subtree.
* Railway's automated deployment hook parses migration files sequentially on application startup prior to routing traffic to ensure zero database schema downtime.

```

```