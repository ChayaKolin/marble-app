-- A roster of measurers (first/last name + phone) the Consultant can pick from
-- when booking a measurement appointment, instead of typing the same details by hand each time.
CREATE TABLE measurers (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30)  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);

-- Lets a MEASUREMENT calendar event reference which measurer from the roster was booked.
ALTER TABLE calendar_events ADD COLUMN measurer_id UUID REFERENCES measurers(id);
