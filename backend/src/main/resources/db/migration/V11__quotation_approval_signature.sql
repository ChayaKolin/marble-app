-- -----------------------------------------------------------------------------
-- TASK — signature_category.QUOTATION_APPROVAL
-- OPTIONAL: customer review/approval of the detailed quotation (specs, sinks,
-- total price) while the order is still in QUOTATION, before measurement.
-- -----------------------------------------------------------------------------
ALTER TYPE signature_category ADD VALUE 'QUOTATION_APPROVAL';
