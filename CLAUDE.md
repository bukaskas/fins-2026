# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (Next.js)
npm run build        # production build
npm run lint         # ESLint
npm run email        # react-email dev server (./emails/)

npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma migrate deploy              # apply pending migrations (CI/prod)
npx prisma studio                      # GUI database browser
npx prisma generate                    # regenerate Prisma Client after schema change
```

No test runner is configured.

## Architecture

**Next.js App Router** with React Server Components. All routes live under `app/`. The main user-facing section is `app/(root)/` with its own layout. API routes are only used for NextAuth (`app/api/auth/`).

**Server Actions** (`lib/actions/*.actions.ts`) are the data layer — all database reads and writes go through these async functions decorated with `"use server"`. Client components call them directly; no REST/tRPC layer exists.

**Database** is Neon serverless PostgreSQL via Prisma ORM. Client singleton is at `db/prisma.ts` using the Neon adapter. The schema covers: bookings, lessons/sessions, beach use, rentals/inventory, orders/payments, wallet/ledger, and auth.

**Money is always stored in integer cents** (`*Cents` suffix on fields). The `WalletLedger` table is append-only — never delete or update rows, only insert.

**Auth** is NextAuth v4 with a credentials provider (bcryptjs) and Prisma adapter. Session strategy is JWT (30-day max age). Role enum: `ADMIN | MEMBER | STAFF | ACCOUNTANT | INSTRUCTOR | KITER | OWNER | DAYPASS`.

**UI** is shadcn/ui (new-york style) + Radix UI primitives + Tailwind v4. Components are in `components/ui/`. Feature components live in subdirectories: `components/bookings/`, `components/kitesurfing/`, `components/lessons/`, etc. Toast notifications use `sonner`.

**Forms** use TanStack React Form with Zod schemas defined in `lib/validators.ts`. Shadcn components are added with `npx shadcn@latest add <component>`.

**Email** is sent via Resend (`resend` package). Templates are React Email components in `emails/`. The send helpers are in `emails/index.tsx`.

**Path alias**: `@/` maps to the project root.
