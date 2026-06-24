-- Store the portal URL so the consultant can retrieve and reshare it at any time.
-- Existing rows get NULL (acceptable — those tokens have already been used/expired).
ALTER TABLE customer_portal_tokens ADD COLUMN portal_url TEXT;
