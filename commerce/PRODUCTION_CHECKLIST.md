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

- [ ] Confirm which US destinations BORGAS will ship to
- [ ] Choose flat-rate, free or carrier-calculated shipping and confirm package weights/dimensions
- [ ] Identify sales-tax nexus states and connect an automated calculation provider
- [ ] Enter physical stock for `brc-02` and `bfd-01-generic`
- [ ] Approve processing-time, shipping, return, refund and warranty wording
- [ ] Set `POLICIES_APPROVED=true` only after those pages are published

## Customer email

- [ ] Configure a production SMTP provider in Supabase Auth
- [ ] Verify SPF, DKIM and DMARC for the chosen sending domain or subdomain
- [ ] Test passwordless sign-in with a non-team customer address
- [ ] Set `AUTH_EMAIL_READY=true` only after successful delivery

## PayPal Live

- [ ] Create or select the BORGAS Store Live REST app
- [ ] Store its secret as the production Worker's `PAYPAL_SECRET`
- [ ] Set the Live client ID and merchant ID in `env.production.vars`
- [ ] Create the Live webhook for `PAYMENT.CAPTURE.COMPLETED`
- [ ] Set the Live webhook ID in `env.production.vars`
- [ ] Verify the webhook URL is `https://borgas-commerce-production.borgas-site.workers.dev/webhook`

## Delivery quote service

- [ ] Deploy an authenticated HTTPS adapter that confirms availability, shipping and tax
- [ ] Store its bearer token as `DELIVERY_QUOTE_TOKEN`
- [ ] Set `DELIVERY_QUOTE_URL` in the production Worker
- [ ] Test unsupported ZIP codes, out-of-stock products, discounts, tax and shipping failures

## Opening checkout

- [ ] Confirm `npm run test:commerce`, `npm run check`, `npm run build` and `npm run build:commerce:production`
- [ ] Set `CHECKOUT_ENABLED=true` last
- [ ] Verify production `/config` returns `checkoutEnabled:true` and no Sandbox flags
- [ ] Change GitHub `PUBLIC_COMMERCE_API_URL` to the production Worker
- [ ] Deploy the website and complete one controlled Live purchase
- [ ] Verify the paid order, inventory decrement and Live webhook delivery
- [ ] Refund the controlled order in PayPal and confirm the customer experience
