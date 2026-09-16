ALTER TABLE orders ADD COLUMN payment_env TEXT NOT NULL DEFAULT 'sandbox' CHECK(payment_env IN ('sandbox','live'));
