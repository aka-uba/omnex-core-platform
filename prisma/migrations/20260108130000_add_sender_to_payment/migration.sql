-- AddSenderToPayment
-- Add sender field to Payment table for tracking payment payer/sender

ALTER TABLE "Payment" ADD COLUMN "sender" TEXT;
