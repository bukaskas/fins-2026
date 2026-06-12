# Database Setup

How the database is configured, connected, and maintained in this project.

## Stack at a glance

| Concern         | Choice                                                            |
| --------------- | ---------------------------------------------------------------- |
| Database        | **PostgreSQL** on **Neon** (serverless)                          |
| ORM             | **Prisma** (`@prisma/client` v6, `prisma` CLI v6)               |
| Driver/adapter  | **Neon serverless** over WebSockets (`@prisma/adapter-neon`)    |
| Client location | Singleton in `db/prisma.ts`                                      |
| Schema          | `prisma/schema.prisma`                                           |
| Migrations      | `prisma/migrations/` (managed by `prisma migrate`)              |
| Money           | Integer **cents** everywhere (`*Cents` fields)                  |
| IDs             | `UUID` via Postgres `gen_random_uuid()`                          |

## Connection

The Prisma client is a single shared instance created with the Neon serverless
adapter. From `db/prisma.ts`:

```ts
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;            // Neon needs a WS impl in Node
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
```

Always import `prisma` from `@/db/prisma` — do not instantiate `PrismaClient`
elsewhere. All DB reads/writes go through the server actions in
`lib/actions/*.actions.ts` (the app has no REST/tRPC layer).

### Prisma schema config

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]   // native + Vercel/Linux runtime
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

`rhel-openssl-3.0.x` is included so the generated client runs on the deployment
runtime (e.g. Vercel) in addition to the local machine.

## Environment variables

Set these in `.env` (local) and in the hosting provider (production). Neon
provisions most of them automatically; Prisma only needs `DATABASE_URL`.

| Variable                                   | Purpose                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| `DATABASE_URL`                             | **Required by Prisma.** Pooled Neon connection string.         |
| `DATABASE_URL_UNPOOLED`                    | Direct (non-pooled) connection — useful for migrations/scripts.|
| `POSTGRES_URL`, `POSTGRES_PRISMA_URL`      | Neon/Vercel-generated connection strings.                      |
| `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NO_SSL` | Variants Neon emits.                                    |
| `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Raw Postgres connection parts.          |
| `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` | Same, alternate naming.        |

> The app reads `process.env.DATABASE_URL` directly. The other keys exist because
> Neon/Vercel generate them; keep them in sync if you rotate credentials.

Other (non-database) env vars used by the app: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
`NEXT_PUBLIC_SERVER_URL`, `RESEND_API_KEY`, `STAFF_EMAIL_DAY_USE`.

## Common commands

```bash
npx prisma migrate dev --name <name>   # create + apply a migration (local dev)
npx prisma migrate deploy              # apply pending migrations (CI / production)
npx prisma generate                    # regenerate Prisma Client after schema change
npx prisma studio                      # GUI database browser
```

`prisma generate` also runs automatically on `postinstall` (see `package.json`),
so the client is always regenerated after `npm install`.

## First-time local setup

1. Install dependencies: `npm install` (triggers `prisma generate`).
2. Create `.env` with at least `DATABASE_URL` pointing at your Neon database
   (use a dev branch in Neon to avoid touching production data).
3. Apply existing migrations: `npx prisma migrate deploy`.
4. (Optional) Inspect data: `npx prisma studio`.
5. Run the app: `npm run dev`.

## Migrations

- Migration history lives in `prisma/migrations/`, each folder a timestamped
  step (e.g. `20260216231723_init` → `20260607090008_add_booking_payment`).
- `prisma/migrations/migration_lock.toml` pins the provider to `postgresql`.
- Workflow: edit `schema.prisma` → `prisma migrate dev --name <change>` locally →
  commit the generated migration folder → `prisma migrate deploy` in
  CI/production.
- Never hand-edit an already-applied migration; create a new one instead.

## Schema domains

The schema (`prisma/schema.prisma`) covers several domains. Key models grouped:

- **Auth / users** — `User`, `Account`, `Session`, `VerificationToken`, `Member`.
  NextAuth-compatible. `User.role` is the `Role` enum
  (`ADMIN | MEMBER | STAFF | ACCOUNTANT | INSTRUCTOR | KITER | OWNER | DAYPASS`,
  default `KITER`).
- **Bookings** — `Booking`, `BookingPayment`, `ClosedDate`. `Booking.bookingStatus`
  uses the `BookingStatus` enum; an optional `agent` (staff `User`) handles it.
- **Lessons** — `LessonSession`, `LessonBooking`, `InstructorProfile`,
  `InstructorCommission` (+ `LessonType`, `LessonBookingStatus`, `CommissionType`,
  `CommissionStatus`, `RevenueSource` enums).
- **Beach use** — `BeachVisit` (+ `BeachUseType`, `BeachVisitStatus`).
- **Inventory & rentals** — `InventoryItem`, `InventoryMovement`, `Rental`,
  `RentalLine` (+ `InventoryCategory`, `ItemCondition`, `RentalStatus`,
  `InventoryMovementType`).
- **Catalog & orders** — `Product`, `Order`, `OrderLine`, `Payment`,
  `PaymentAllocation` (+ `ProductType`, `ProductCategory`, `OrderStatus`,
  `PaymentMethod`).
- **Wallet / credits** — `UserWallet`, `WalletLedger` (+ `WalletType`,
  `WalletUnit`, `WalletLedgerReason`). Prepaid credits/hours.
- **Expenses** — `Expense` (+ `ExpenseType`, `ExpenseStatus`).

## Conventions & invariants

- **Money is always integer cents** — fields carry a `*Cents` suffix
  (e.g. `priceCents`, `totalPriceCents`, `amountPaidCents`). Default currency
  `"EGP"`. Never store fractional money as floats.
- **`WalletLedger` is append-only** — only INSERT rows; never UPDATE or DELETE.
  Each row records `delta`, the resulting `balanceAfter`, a `reason`, and an
  optional `idempotencyKey` (unique per wallet) to make credit posting safe to
  retry. `UserWallet.balance` is the materialized current balance.
- **UUID primary keys** generated in Postgres via
  `@default(dbgenerated("gen_random_uuid()")) @db.Uuid`.
- **Timestamps** use `@db.Timestamp(6)`; `createdAt` defaults to `now()`,
  `updatedAt` uses `@updatedAt`.
- **Referential actions** are explicit: child records cascade
  (`onDelete: Cascade`), optional links null out (`SetNull`), and records that
  must not orphan use `Restrict` (e.g. `Rental.order`, commission instructor).
- **Decimal** is used only where fractional units are real: `OrderLine.qty`
  (`Decimal(10,4)`) and wallet balances/deltas (`Decimal(12,2)`).

## Maintenance / backfill scripts

One-off data scripts live in `scripts/` and run via `tsx`:

```bash
npm run backfill-expenses          # scripts/backfill-expenses.ts
npm run backfill-daypass-users     # scripts/backfill-daypass-users.ts
# also present: backfill-product-lesson-fields.ts, backfill-session-revenue.ts
```

These connect through the same `@/db/prisma` client, so they require a valid
`DATABASE_URL`. Run them against the intended environment deliberately.

## Notes

- There is **no seed script** configured (`prisma db seed` is not set up).
- There is **no test database / test runner** configured.
