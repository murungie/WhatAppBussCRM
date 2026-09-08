# WhatsApp CRM — Phase 1 Scaffold

## What's built
- NestJS project with Prisma schema for the full data model (Business, Customer,
  Message, Order, Payment, AutoReplyRule, Broadcast)
- Multi-tenant auth: register/login per Business, JWT-protected routes
- `CurrentBusiness` decorator to scope any future query by tenant
- Passes `tsc --noEmit` clean

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in a real `DATABASE_URL`
   (a free Postgres instance on Railway/Neon/Supabase works fine to start)
3. `npx prisma generate`
4. `npx prisma migrate dev --name init`
5. `npm run start:dev`

## Try the auth endpoints
```
POST /auth/register
{ "businessName": "Amina's Boutique", "email": "amina@example.com", "password": "supersecret" }

POST /auth/login
{ "email": "amina@example.com", "password": "supersecret" }
```
Both return `{ accessToken }` — send it as `Authorization: Bearer <token>` on
protected routes (guard them with `@UseGuards(JwtAuthGuard)`).

## Next build steps (Phase 2)
- `CustomerModule` + `MessageModule`: WhatsApp Cloud API webhook that
  auto-creates/links a Customer by phone number on inbound messages
- Inbox endpoint(s) for the dashboard to list conversations
- `OrderModule`: convert a message thread into an Order, manual "mark as paid"

## Phase 3 (selling features)
- `BroadcastModule`: send to a customer segment (all / inactive 30 days)
- `AutoReplyRule` matching on inbound webhook messages
- Customer history endpoint (total spent, last order, order count — fields
  already on the Customer model)
