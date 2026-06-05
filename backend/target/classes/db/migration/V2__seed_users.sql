-- Initial system users for Kostone Marble ERP.
-- Default password for both users: admin123
-- IMPORTANT: Change passwords after first login.

INSERT INTO users (id, username, full_name, password_hash, role, phone_number)
VALUES
    (
        gen_random_uuid(),
        'consultant',
        'יועץ ראשי',
        '$2a$10$qyd11Pxnwn14YIOYx.I4bOF20AIQ2Q7daw/VnU2IrDIb8YuaDbQ2e',
        'SUPER_ADMIN_OWNER',
        ''
    ),
    (
        gen_random_uuid(),
        'hotman',
        'מנהל מפעל',
        '$2a$10$wvgiKnuTqvCjyaDuQ/Y9MOzvO.OCsANQXstogfAWF1kQ4ndvLWoye',
        'FACTORY_MANAGER',
        ''
    );
