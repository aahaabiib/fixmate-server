# FixMate Server

Express + MongoDB REST API for FixMate, the smart device and home appliance repair platform.

- **Live API:** https://fixmate-server-theta.vercel.app
- **Health check:** https://fixmate-server-theta.vercel.app/api/health
- **Live site (client):** https://fixmate-client-nine.vercel.app
- **Client repo:** https://github.com/aahaabiib/fixmate-client

See the client repo README for demo credentials.

## Features

- JWT auth (verified with `jose` against the BetterAuth JWKS)
- Role middlewares: `verifyToken`, `verifyCustomer`, `verifyTechnician`, `verifyAdmin`
- Server-side search, filter, sort and pagination for services
- Job status pipeline enforced on the server
- Stripe Checkout session, payment verify and a webhook (raw body, signature verified, no double save)
- Admin APIs for users, services, bookings, transactions and stats
- Profile API

## npm Packages

`express`, `mongodb`, `jose`, `cors`, `dotenv`, `stripe`

