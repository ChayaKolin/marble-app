-- Seed an initial admin user so the production app has at least one login.
-- Idempotent: only inserts when the users table is completely empty.
-- Password: admin123 (bcrypt, cost 10)
-- IMPORTANT: Change this password immediately after first login.

INSERT INTO users (id, username, full_name, password_hash, role, phone_number)
SELECT
    gen_random_uuid(),
    'admin',
    'Admin User',
    '$2a$10$slYQmyNdGzin7olVAklFOOJV4/xbWXHQVcsFHWK1yWmlMVvjO8eFm',
    'SUPER_ADMIN_OWNER',
    '+972500000000'
WHERE NOT EXISTS (SELECT 1 FROM users);
