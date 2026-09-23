-- BORGAS Asset Creator purchase keys issued by the Worker after a verified capture.
-- One row per (order, product); UNIQUE makes issuing idempotent across webhook
-- retries and the capture path. license_key is what the buyer pastes into BAC.
CREATE TABLE licenses (
 license_id TEXT PRIMARY KEY,
 order_id TEXT NOT NULL,
 sku TEXT NOT NULL,
 payment_env TEXT NOT NULL CHECK(payment_env IN ('sandbox','live')),
 licensee TEXT NOT NULL,
 email TEXT NOT NULL,
 license_key TEXT NOT NULL,
 issued_at TEXT NOT NULL,
 emailed_at TEXT,
 UNIQUE(order_id, sku),
 FOREIGN KEY(order_id) REFERENCES orders(id)
);
CREATE INDEX licenses_sku_env ON licenses(sku, payment_env);
