# BORGAS commerce production checklist

## Completed

- [x] PayPal Sandbox buyer approval, capture and customer history verified
- [x] Separate production Worker deployed with checkout disabled
- [x] Separate production D1 database created and migrated
- [x] Production inventory starts at zero
- [x] Atomic inventory reservation, release and capture consumption tested
- [x] Browser-supplied prices rejected; totals calculated by the Worker
- [x] Verified PayPal webhook and idempotent capture paths tested

## Business settings required

- [x] Confirm US-only destinations
- [x] Offer free shipping to the 50 states and Washington, DC
- [x] Record Massachusetts as the initial sales-tax nexus at 6.25%
- [x] Enter physical stock: 2 `brc-02` and 2 `bfd-01-generic`
- [x] Publish 2–3 business-day processing and a 30-day return window
- [ ] Confirm final refund/warranty wording
- [ ] Set `POLICIES_APPROVED=true` only after those pages are published

## Customer email

- [x] Configure a production SMTP provider in Supabase Auth
- [x] Verify SPF, DKIM and DMARC for the chosen sending domain or subdomain
- [x] Test passwordless sign-in with a non-team customer address
- [x] Set `AUTH_EMAIL_READY=true` only after successful delivery

## PayPal Live

- [x] Create the BORGAS Store Live REST app
- [x] Store its secret as the production Worker's `PAYPAL_SECRET`
- [x] Set the Live client ID and merchant ID in `env.production.vars`
- [x] Create the Live webhook for `PAYMENT.CAPTURE.COMPLETED`
- [x] Set the Live webhook ID in `env.production.vars`
- [x] Verify the webhook URL is `https://borgas-commerce-production.borgas-site.workers.dev/webhook`

## Delivery and tax

- [x] Configure free US shipping
- [x] Configure 6.25% Massachusetts sales tax after discounts and zero tax outside the recorded nexus
- [ ] Confirm Massachusetts sales-tax registration before opening checkout
- [x] Test invalid states, out-of-stock products, discounts and Massachusetts tax rounding
- [ ] Connect an address-level tax service before adding any nexus state beyond Massachusetts

## Opening checkout

- [ ] Confirm `npm run test:commerce`, `npm run check`, `npm run build` and `npm run build:commerce:production`
- [ ] Set `CHECKOUT_ENABLED=true` last
- [ ] Verify production `/config` returns `checkoutEnabled:true` and no Sandbox flags
- [ ] Change GitHub `PUBLIC_COMMERCE_API_URL` to the production Worker
- [ ] Deploy the website and complete one controlled Live purchase
- [ ] Verify the paid order, inventory decrement and Live webhook delivery
- [ ] Refund the controlled order in PayPal and confirm the customer experience
