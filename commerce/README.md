# BORGAS commerce setup

The Astro storefront stays on GitHub Pages. A separate Cloudflare Worker/D1 service handles orders, discounts and PayPal; Supabase Auth handles email sign-in. No paid service has been provisioned and checkout is disabled by default.

## Local checks

From the site root: npm run check, npm run build, npm run test:commerce, npm run build:commerce (dry-run only). Shop: /shop/; cart: /cart/; account: /account/. Cart entries contain only SKU and quantity. Product prices in shared/catalog.json are authoritative on both server and frontend.

## Connect accounts

Create a Supabase project and configure passwordless email sign-in. The frontend uses PKCE magic links with the default email template, so template editing is not required. Allow the exact /account/ callback for each trusted frontend origin; local testing uses http://127.0.0.1:4322/account/. Open test email links in the same browser that requested them. Configure the site URL as https://borgas.us and use production SMTP plus authentication rate limits/CAPTCHA appropriate to launch traffic. Put the project URL and publishable key in the frontend PUBLIC_ variables and the Worker SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. Never expose a service-role key. Email verification is required server-side. Supabase sessions remain in the browser until sign-out/expiry; order ownership comes only from the verified user response.

## Connect payment infrastructure

1. Create a Cloudflare D1 database, replace database_id in commerce/wrangler.jsonc, and apply migrations with Wrangler. D1 stores delivery details and order records: restrict dashboard access and configure backups/retention before launch.
2. Create a PayPal sandbox REST app first. Store PAYPAL_SECRET via Wrangler secret; set PAYPAL_CLIENT_ID and PAYPAL_MERCHANT_ID for that same merchant. Use PAYPAL_ENV=sandbox until tests pass.
3. Register the Worker /webhook URL for PAYMENT.CAPTURE.COMPLETED and store PAYPAL_WEBHOOK_ID. Incoming events are verified with PayPal and the order is fetched independently. This recovers a completed payment even if the browser closes. PayPal dashboard remains the source for disputes, refunds and fulfillment; this first version does not synchronize those states or send fulfillment emails.
4. Provide DELIVERY_QUOTE_URL and secret DELIVERY_QUOTE_TOKEN for an authenticated merchant-controlled shipping/tax/availability adapter. This adapter is deliberately NOT fabricated: selling destinations, stock, shipping rates, tax treatment and package contents are unconfirmed. Request: {items:[{sku,name,quantity,price}],address:{fullName,addressLine1,addressLine2,city,state,postalCode},subtotal,discount,currency:'USD'}. Response: {available:true,shipping:integerCents,tax:integerCents}. Reject unavailable stock/destinations. Calculate tax on the actual discounted items and shipping under the applicable rules. The service requires this adapter; missing fees do not default to zero. A production inventory reservation flow and address/tax-provider integration must be completed before opening orders.
5. Set PUBLIC_COMMERCE_API_URL to the Worker HTTPS origin in the frontend build. Add all three PUBLIC_ settings to the GitHub Actions build environment. Do not put credentials in repository files. Rebuild after changing public configuration.
6. Test sandbox checkout, failed/declined/pending payment, coupon expiry, amount tampering, changed address, two different accounts, duplicate capture, closed browser and webhook recovery. Confirm shipping and tax adapter behavior with actual destinations.
7. Before opening real orders: finalize package contents, shipping/returns terms, inventory/reservations, retention/privacy notice, production email delivery and production tax/shipping adapter; add PayPal live credentials and webhook; remove the storefront 'being prepared' notice; set PAYPAL_ENV=live and CHECKOUT_ENABLED=true deliberately. These are launch requirements, not completed work.

## Discount codes

Coupons live in D1, never in frontend code. Values are integer cents for fixed discounts, basis points for percentages (1000 = 10%). Use uppercase letters, numbers, underscores or hyphens. No coupons have been enabled. Add approved codes via a parameterized admin script or the D1 dashboard; set enabled=1, minimum and optional ISO UTC start/expiry. Discounts apply to items before shipping and tax. No stacking, per-customer limits or redemption caps in this version; do not advertise limited-use codes. Creation and capture use server totals; browser totals cannot change prices.

## Operational limitations

Customer order history shows the last 50 orders and payment status only, not shipment tracking or refunds. PayPal confirmation is checked for matching order ID, custom ID, merchant, currency and amount. Captures use a stable idempotency key. Created orders expire for capture after 30 minutes. Monitor unreconciled orders and PayPal dashboard; never fulfill from a client-side success screen alone. No live checkout is authorized by merely adding keys.

Automated API integration tests use an in-memory SQLite database and mocked PayPal/Supabase/delivery responses. They test ownership, tampered prices, amount mismatch, webhook verification/recovery and capture retry behavior; they do not replace real sandbox testing.

## Restricted Sandbox test mode
SANDBOX_TEST_MODE=true works only with PAYPAL_ENV=sandbox and a SANDBOX_TEST_EMAIL secret. Only that verified email can create/capture test orders or use /sandbox/check. CHECKOUT_ENABLED stays false, so changing PAYPAL_ENV to live does not enable sales. Test shipping/tax are fixed at USD 10/12, explicitly labeled in the UI, and never used in live mode. Payment environment is stored on each order. SANDBOX_PREVIEW_ORIGIN allows the local preview only while PAYPAL_ENV=sandbox. Disable test mode after validation.
