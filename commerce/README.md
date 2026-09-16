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
4. Production currently uses the merchant-confirmed built-in delivery rule: free shipping to the 50 states and Washington, DC, with 6.25% tax on the discounted merchandise total for Massachusetts addresses and zero seller-collected tax elsewhere. This requires `FREE_US_SHIPPING=true`, `SALES_TAX_STATE=MA` and `SALES_TAX_BPS=625`. Confirm Massachusetts registration before opening checkout and review nexus whenever BORGAS gains a physical presence or approaches another state's economic threshold. For more complex rules, replace this with an authenticated merchant-controlled adapter using `DELIVERY_QUOTE_URL` and secret `DELIVERY_QUOTE_TOKEN`; the response must include `{available:true,shipping:integerCents,tax:integerCents}`.

Do not extend the built-in rule with a table of flat state percentages. Many destinations add county, city and special-district rates, while sourcing, product taxability, holidays and shipping rules also vary. When BORGAS registers in another state, connect an address-level calculation service and enable only registered nexus jurisdictions. Stripe Tax supports custom flows using another payment processor; TaxJar's transaction endpoint also evaluates nexus and rooftop-level rates. Keep checkout fail-closed if the calculation service is unavailable.
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

## Separate production environment

The Sandbox Worker and database must remain available for regression tests:

- Worker: `borgas-commerce`
- D1: `borgas-orders`
- Endpoint: `https://borgas-commerce.borgas-site.workers.dev`

Production is isolated through the Wrangler `production` environment:

- Worker: `borgas-commerce-production`
- D1: `borgas-orders-production`
- Endpoint: `https://borgas-commerce-production.borgas-site.workers.dev`

Run production commands with `--env production`. Omitting the environment targets Sandbox. Never point the website at the production endpoint until its `/config` response has been intentionally verified.

Production checkout remains fail-closed until all of these are true:

- `CHECKOUT_ENABLED=true` and `PAYPAL_ENV=live`
- Live PayPal client ID, secret, merchant ID and webhook ID are present
- Built-in free-US-shipping and Massachusetts tax settings are valid, or an HTTPS delivery/tax adapter and secret are configured
- `POLICIES_APPROVED=true` after the public shipping/return/privacy wording is finalized
- `AUTH_EMAIL_READY=true` after Supabase custom SMTP has been configured and tested
- Inventory contains sufficient unreserved stock

Store `PAYPAL_SECRET` and any optional `DELIVERY_QUOTE_TOKEN` as Cloudflare secrets. Live client, merchant and webhook IDs are environment configuration, not Sandbox values. The Live PayPal webhook URL is `https://borgas-commerce-production.borgas-site.workers.dev/webhook` and must subscribe to `PAYMENT.CAPTURE.COMPLETED`.

### Inventory

Migration `0003_inventory_reservations.sql` creates inventory rows with zero stock. Setting stock is a deliberate production operation. For example, after physically counting finished units, update each SKU with a parameterized admin command or the D1 dashboard; never change `reserved` manually.

At order creation, D1 atomically reserves stock for 30 minutes. A failed PayPal order releases it, an expired checkout releases it, and a verified capture consumes it once. Database constraints prevent `reserved` from exceeding `on_hand`. The production Worker checks availability again before both quote and reservation.

Before enabling checkout, verify:

```sql
SELECT sku, on_hand, reserved FROM inventory ORDER BY sku;
```

### Production checks

Run `npm run test:commerce`, `npm run check`, `npm run build`, and `npm run build:commerce:production`. Apply all migrations to `borgas-orders-production`. Confirm the production `/config` endpoint still returns `checkoutEnabled:false` while any launch gate is incomplete. Only after a controlled Live purchase and refund test should GitHub's `PUBLIC_COMMERCE_API_URL` be changed from Sandbox to the production endpoint.
