## ADDED Requirements

### Requirement: Analytics dashboard is exclusively accessible to the Consultant
The system SHALL restrict the analytics dashboard and all its data endpoints to `SUPER_ADMIN_OWNER` role. Factory Manager, Installer, and Customer roles SHALL receive HTTP 403 on any analytics endpoint regardless of permission toggles.

#### Scenario: Consultant accesses analytics
- **WHEN** the Consultant opens the analytics dashboard
- **THEN** all revenue charts, material volumetrics, SLA compliance, and installer ratings are displayed

#### Scenario: Hotman blocked from analytics endpoint
- **WHEN** a Factory Manager attempts to access an analytics data endpoint directly
- **THEN** the system returns HTTP 403

### Requirement: Dashboard displays monthly revenue and receivables
The analytics dashboard SHALL display gross financial yield per calendar month, collected inflows (20% deposits + cleared 80% balances), and outstanding receivables pipeline as comparative bar charts.

#### Scenario: Monthly summary displayed
- **WHEN** the Consultant opens the analytics dashboard for the current month
- **THEN** total revenue, collected cash, and pipeline receivables are shown as distinct bar chart segments

### Requirement: Material volumetric distribution is visualised
The dashboard SHALL display a pie chart of surface area (m²) processed per marble model/code for the selected period, to support factory purchasing decisions.

#### Scenario: Material distribution chart
- **WHEN** the Consultant views the material distribution chart
- **THEN** each marble model code is shown with its processed m² share as a pie segment

### Requirement: SLA compliance and installer performance are tracked
The dashboard SHALL show time-series charts of Hotman's actual production time vs committed SLA deadlines, and per-installer quality flags from post-installation notes.

#### Scenario: SLA compliance chart
- **WHEN** the Consultant views factory throughput
- **THEN** a line chart shows for each completed order the SLA deadline vs actual completion date
