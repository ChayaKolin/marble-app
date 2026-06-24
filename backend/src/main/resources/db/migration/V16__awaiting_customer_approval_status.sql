-- New order lifecycle status: after installation is complete and final payment is received,
-- the order moves here so the customer can digitally approve the finished work.
-- Replaces the direct AWAITING_INSTALLATION → COMPLETED jump.
ALTER TYPE order_status ADD VALUE 'AWAITING_CUSTOMER_APPROVAL' AFTER 'AWAITING_INSTALLATION';
