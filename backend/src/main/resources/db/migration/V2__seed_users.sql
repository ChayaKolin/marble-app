-- =============================================================================
-- Seed: initial system users
-- Passwords are BCrypt hashes. Replace with real hashed values before deploy.
-- Default placeholder hash below = BCrypt('change-me-on-first-login')
-- =============================================================================

INSERT INTO users (id, username, full_name, password_hash, role, phone_number)
VALUES
    (
        gen_random_uuid(),
        'consultant',
        'יועץ ראשי',
        '$2a$12$PLACEHOLDER_REPLACE_BEFORE_DEPLOY_consultant000000000000',
        'SUPER_ADMIN_OWNER',
        ''
    ),
    (
        gen_random_uuid(),
        'hotman',
        'מנהל מפעל',
        '$2a$12$PLACEHOLDER_REPLACE_BEFORE_DEPLOY_hotman0000000000000000',
        'FACTORY_MANAGER',
        ''
    );

-- NOTE: Update username, full_name, password_hash, and phone_number
-- before first production deployment. Phone numbers are used for
-- WhatsApp notification delivery (Twilio).
