CREATE TABLE inventory (
 sku TEXT PRIMARY KEY,
 on_hand INTEGER NOT NULL DEFAULT 0 CHECK(on_hand >= 0),
 reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0 AND reserved <= on_hand),
 updated_at TEXT NOT NULL
);

INSERT INTO inventory (sku,on_hand,reserved,updated_at) VALUES
 ('brc-02',0,0,CURRENT_TIMESTAMP),
 ('bfd-01-generic',0,0,CURRENT_TIMESTAMP);

CREATE TABLE inventory_reservations (
 order_id TEXT NOT NULL,
 sku TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity > 0),
 status TEXT NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','consumed','released')),
 expires_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(order_id,sku),
 FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
 FOREIGN KEY(sku) REFERENCES inventory(sku)
);

CREATE INDEX inventory_reservations_expiry ON inventory_reservations(status,expires_at);

ALTER TABLE orders ADD COLUMN fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
 CHECK(fulfillment_status IN ('unfulfilled','processing','shipped','cancelled','refunded'));
