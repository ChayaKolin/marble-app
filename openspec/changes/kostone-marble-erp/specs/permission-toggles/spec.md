## ADDED Requirements

### Requirement: Feature permissions are stored per user per feature key
The system SHALL store feature permissions in a `user_permissions` table with one row per `(user_id, feature)` pair. Valid `feature_key` values are: `VIEW_ANALYTICS`, `VIEW_FINANCIAL_CHARTS`, `MANAGE_CALENDAR`, `VIEW_INSTALLER_RATINGS`, `EXPORT_REPORTS`. Only `SUPER_ADMIN_OWNER` users SHALL appear in the `granted_by` column.

#### Scenario: Permission row created
- **WHEN** the Consultant grants VIEW_ANALYTICS to the Factory Manager
- **THEN** a row is upserted in `user_permissions` with `granted = TRUE`, `granted_by = consultant_id`, and `granted_at = NOW()`

#### Scenario: Permission revoked
- **WHEN** the Consultant revokes VIEW_ANALYTICS from the Factory Manager
- **THEN** the row is updated with `granted = FALSE`

### Requirement: Permissions are embedded in the JWT at login
The system SHALL encode the user's active granted features as `granted_features[]` in the JWT claims at login time. Spring Security method guards SHALL read this array via `@PreAuthorize`. Feature flag changes take effect at the user's next login.

#### Scenario: Updated permissions reflected after re-login
- **WHEN** the Consultant grants MANAGE_CALENDAR to the Factory Manager and the Factory Manager logs out and back in
- **THEN** the new JWT includes MANAGE_CALENDAR in `granted_features[]` and calendar write access is unlocked

### Requirement: Consultant controls all permission toggles via a UI panel
The Consultant dashboard SHALL display a permission panel listing all five toggleable features for the Factory Manager, each with a toggle switch showing the current state. Toggling a switch SHALL immediately call `PUT /api/v1/admin/permissions/{userId}`.

#### Scenario: Toggle switch reflects current state
- **WHEN** the Consultant opens the permission panel
- **THEN** each toggle displays ON or OFF matching the current `granted` value in `user_permissions`

#### Scenario: Calendar note visible in permission panel
- **WHEN** the Consultant views the permission panel
- **THEN** a note below the calendar toggle indicates Hotman always has read access to the calendar regardless of this toggle
