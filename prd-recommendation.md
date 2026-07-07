# How to Create a PRD for Fins Store

This project is already built and evolving, so you don't need a classic "greenfield" PRD. What you need is a **retroactive PRD**: a document that captures what the product does today, why it works that way, and how future features get decided. This file explains how to write one for this codebase.

## 1. Why write a PRD now

- **The code answers "how", not "why".** Business rules (e.g. how commissions split, when a wallet is debited, who can cancel a booking) live implicitly in `lib/actions/*.actions.ts`. A PRD makes them explicit so they survive refactors.
- **You have many roles** (`ADMIN | MEMBER | STAFF | ACCOUNTANT | INSTRUCTOR | KITER | OWNER | DAYPASS`). A PRD is the single place that says what each role is allowed to see and do — right now that's scattered across layouts, guards, and actions.
- **It speeds up future work with Claude Code.** A good PRD next to `CLAUDE.md` gives any AI or human contributor the business context the code can't provide.

## 2. Recommended file layout

Keep it in the repo, versioned with the code:

```
docs/
  prd/
    00-overview.md          # product vision, users, glossary
    01-roles-permissions.md # role matrix: who can do what
    02-bookings.md          # one file per domain module
    03-lessons.md
    04-rentals-inventory.md
    05-day-use-beach.md
    06-payments-wallet.md
    07-accounting.md
    08-reception.md
    09-restaurant.md
    99-backlog.md           # future features / open questions
```

One file per module beats one giant document: it diffs cleanly in git, and you can point Claude Code at a single module file when working on that area.

## 3. Structure for each module file

Use the same template for every `0X-*.md` file:

```markdown
# <Module name>

## Purpose
One paragraph: who uses this and what problem it solves.

## Users & roles
Which roles interact with it and how (table works well).

## Core flows
Numbered user flows, e.g. "Reception books a lesson for a walk-in":
1. ...
2. ...

## Business rules
The invariants — this is the most valuable section. Examples for this app:
- Money is always integer cents; never floats.
- WalletLedger is append-only: corrections are new rows, never edits.
- <cancellation windows, deposit rules, commission percentages, ...>

## Data
Which Prisma models this module owns (link to prisma/schema.prisma).

## Edge cases & known limitations
Things you've decided NOT to handle, and why.

## Open questions
Decisions still pending.
```

## 4. How to fill it in (fastest path)

Work module by module, in this order — it mirrors the money flow:

1. **Roles & permissions first** (`01`). Grep the codebase for role checks and turn them into a matrix. This exposes inconsistencies immediately.
2. **Payments & wallet** (`06`). The ledger rules are the riskiest to get wrong; document them before anything that touches money.
3. **Bookings and lessons** (`02`, `03`) — the core revenue flows.
4. Everything else.

For each module, a practical loop:

1. Ask Claude Code: *"Read `lib/actions/booking.actions.ts` and the booking components, then draft `docs/prd/02-bookings.md` using the template — list every business rule you find in the code and flag the ones that look ambiguous."*
2. **Review the flagged ambiguities yourself** — those are the real product decisions. Correct anything where the code does something you didn't intend (that's a bug you just found for free).
3. Commit the file. Repeat for the next module.

This "code-first draft, human-verified rules" approach takes an evening per module instead of weeks.

## 5. The overview file (`00-overview.md`)

Keep it short (1–2 pages):

- **Vision**: e.g. "One system for running the Fins kitesurf/beach operation: lessons, rentals, day passes, F&B, and the accounting behind them — replacing spreadsheets and paper."
- **Primary users**: reception staff, instructors, accountant, owner, and self-service members.
- **Success criteria**: what "working" means (e.g. reception can process a walk-in in under 2 minutes; accountant can reconcile a day without leaving the app).
- **Glossary**: define terms like *session*, *beach use*, *day pass*, *wallet*, *ledger* — ambiguous naming is where bugs come from.
- **Out of scope**: explicitly list what the app will not do (e.g. payroll, online card payments if that's true).

## 6. For new features going forward

Once the retroactive PRD exists, new features get a lightweight one-pager appended to the relevant module file (or `99-backlog.md` until scheduled):

- **Problem** (1–3 sentences, from the user's point of view)
- **Proposed solution** (rough, not a spec)
- **Business rules that change** (this keeps the module file authoritative)
- **Non-goals**
- **Rollout / migration notes** (does it need a Prisma migration? backfill?)

Rule of thumb: if a change touches money, roles, or the ledger, it must update the PRD in the same PR.

## 7. Practical tips

- **Link, don't duplicate.** Reference `prisma/schema.prisma` models and `lib/validators.ts` schemas by name instead of copying field lists that will drift.
- **Add a pointer in `CLAUDE.md`** (e.g. "Product requirements live in `docs/prd/` — consult the relevant module file before changing business logic") so Claude Code reads the PRD automatically when relevant.
- **Date your decisions.** A one-line "Decided 2026-07: rentals require a deposit because X" is far more useful later than the rule alone.
- **Don't chase completeness.** A PRD that covers roles, money, and bookings accurately is worth more than a full one that's half-guessed.
