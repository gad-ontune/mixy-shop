# MIX

MIX is a Kenyan electronics and digital services platform: an online store, a phone
repair service (MIX Care), digital services (printing, typing, CVs and online
assistance), customer accounts and a permission-based admin dashboard.

Built with Next.js (App Router), JavaScript, Tailwind CSS, PostgreSQL and Prisma.

## Features

- **MIX Store** — catalogue, categories, search, filters, product pages, guest and signed-in cart, collection or delivery checkout, M-PESA STK Push and order tracking.
- **MIX Care** — repair booking with private device photos, reference-based tracking and a status timeline.
- **MIX Digital Services** — service requests with private document uploads, quotes and status updates.
- **Customer accounts** — order, repair and service request history plus profile management.
- **Admin dashboard** — products, variants, categories, brands, inventory, orders, payments, repairs, digital services, customers, reports, staff, settings, announcements and audit log.
- **Roles and permissions** — Admin, Staff, Technician and Customer accounts with per-area permission checks on the server.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | JavaScript (no TypeScript) |
| Styling | Tailwind CSS, shadcn-style local components, Lucide icons |
| Database | PostgreSQL + Prisma |
| Auth | Auth.js (NextAuth v5) credentials |
| Payments | Safaricom M-PESA Daraja STK Push (with a development simulation mode) |
| Uploads | Private local storage or Cloudinary, served through an authorized route |
| Email | Nodemailer when SMTP is configured; in-app notifications otherwise |

Money is stored and displayed as integer Kenyan shillings (KES).

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` and `AUTH_SECRET`. For local payment testing set
   `PAYMENTS_SIMULATION=true` (simulation is ignored in production).

3. Create the schema and seed demo data:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The app runs at http://localhost:3000.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@mix.co.ke` | `Admin@12345` |
| Staff | `staff@mix.co.ke` | `Staff@12345` |
| Technician | `tech@mix.co.ke` | `Tech@12345` |
| Customer | `customer@mix.co.ke` | `Customer@12345` |

Demo accounts and sample orders/repairs are for local development only. Remove or
change them before deploying to production.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and build for production |
| `npm start` | Run the production build |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset the database and seed again |

## Payments

The M-PESA flow creates an order and a pending payment, initiates STK Push, and only
treats the order as paid when a verified, idempotent callback or a successful status
query confirms it. Browser-submitted totals are never trusted; totals are recomputed
from the database cart. Secrets are read from environment variables only.

In development, `PAYMENTS_SIMULATION=true` completes payments locally with a
`SIM...` receipt and never runs in production.

## Uploads

Repair photos and digital service documents are stored privately. With Cloudinary
configured they are uploaded there; otherwise they are written to `UPLOAD_DIR`
(default `private/uploads`). Files are only served through `/api/files/[...key]`
after an authorization check. No public file URLs are generated.

## Project structure

```
prisma/            Schema and seed data
src/actions/       Server actions (auth, cart, checkout, repairs, services, admin)
src/app/           App Router routes: (public), (store), admin, api
src/components/    UI, layout, store, checkout, account and admin components
src/lib/           Auth, authorization, cart, inventory, payments, storage, validation
```
