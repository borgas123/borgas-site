CREATE TABLE orders (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL,
 paypal_id TEXT UNIQUE, capture_id TEXT UNIQUE, total INTEGER NOT NULL CHECK(total>0),
 details TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('created','pending','paid')),
 created_at TEXT NOT NULL
);
CREATE INDEX orders_user_created ON orders(user_id,created_at DESC);
CREATE TABLE coupons (
 code TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('percent','fixed')),
 value INTEGER NOT NULL CHECK(value>0), minimum INTEGER NOT NULL DEFAULT 0 CHECK(minimum>=0),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)), starts_at TEXT, expires_at TEXT,
 CHECK(kind != 'percent' OR value <= 10000)
);
-- No live discounts are created automatically. Percentage values use basis points (1000 = 10%).
