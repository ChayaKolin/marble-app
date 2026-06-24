-- Add initial admin user for Kostone Marble ERP.
-- Idempotent: skipped if a user with username 'admin' already exists.
-- Default password: admin123 — change after first login.

INSERT INTO users (id, username, full_name, password_hash, role, phone_number)
SELECT
    gen_random_uuid(),
    'admin',
    'Admin User',
    '$2a$10$slYQmyNdGzin7olVAklFOOJV4/xbWXHQVcsFHWK1yWmlMVvjO8eFm',
    'SUPER_ADMIN_OWNER',
    '+972500000000'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);
