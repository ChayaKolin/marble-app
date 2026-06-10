-- -----------------------------------------------------------------------------
-- Sink specifications: quantity (e.g. matching dairy + meat sinks) and free-text notes
-- -----------------------------------------------------------------------------
ALTER TABLE sink_specifications
    ADD COLUMN quantity INT NOT NULL DEFAULT 1,
    ADD COLUMN notes    TEXT;
