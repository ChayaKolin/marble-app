-- Add document storage columns to orders.
-- layout_document_url: set by Hotman when the cutting layout PDF is uploaded.
-- measurements_document_url: set when field measurements are uploaded.
ALTER TABLE orders
    ADD COLUMN layout_document_url      VARCHAR(500),
    ADD COLUMN measurements_document_url VARCHAR(500);
