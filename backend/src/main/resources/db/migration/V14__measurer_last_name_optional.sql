-- The measurer's last name is not required — the roster only needs a way to
-- identify them and a phone number to contact them.
ALTER TABLE measurers ALTER COLUMN last_name DROP NOT NULL;
