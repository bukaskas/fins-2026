# Login / Authentication Review

_Reviewed: 2026-06-11_

This is a security review of the authentication setup: NextAuth credentials
provider, sign-in/sign-up flows, password handling, and route/action
authorization.

## Files reviewed

- `lib/auth.ts` — NextAuth config (credentials provider, JWT session, callbacks)
- `lib/actions/user.actions.ts` — user create/update/delete/list server actions
- `lib/validators.ts` — Zod schemas for sign-up and user edit
- `app/(root)/signin/SignInForm.tsx` — sign-in form
- `app/(root)/signup/SignUpForm.tsx` — sign-up form
- `app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
- `app/(root)/users/page.tsx` — user management page

## What's solid

- Passwords are hashed with bcrypt (cost 10) on every write path; plaintext is
  never stored. Comparison uses `bcryptjs.compare`, which is constant-time.
- `authorize` returns `null` for unknown email, missing password, and bad
  password without leaking which one failed; the UI shows a single generic
  "Invalid email or password" message. Good — no user enumeration via the
  sign-in form.
- JWT session with a 30-day max age and a daily refresh (`updateAge`). Reasonable.
- `NEXTAUTH_SECRET` is set in env and `.env*` is gitignored / not tracked in git.
- Email has a unique constraint at the DB level (`@unique`), and duplicate
  inserts are caught (`P2002`) and surfaced as a clean message.
- Server actions and pages use `getServerSession` for booking flows, and
  `createBooking` correctly gates closed-date logic on `STAFF_ROLES`.

## Issues found

### 1. HIGH — `/users` admin page and user server actions have no authorization — ✅ FIXED (2026-06-11)

> **Resolved.** Added `lib/auth-guard.ts` with role constants (`ADMIN_ROLES`,
> `STAFF_ROLES`) and guards (`hasRole`, `requireRole`, `requireRolePage`).
> Every privileged action in `user.actions.ts` now checks the caller's role:
> `createUserAsAdmin` / `updateUser` / `deleteUser` / `getUserById` /
> `listUsersForExport` require admin/owner; `listUsers` / `searchUser` /
> `listInstructors` / `listAgents` / `createStudent` / `createGuest` require a
> staff-level role. The `/users`, `/users/new`, and `/users/edit/[id]` pages
> redirect non-admins to `/signin`. Public signup (`createUser`) and the
> internal `verifyPassword` helper are intentionally left open. Original
> description below.


`app/(root)/users/page.tsx` calls `listUsers()` with no `getServerSession`
check and no role gate. Any authenticated user (default role `KITER`) — or
anyone, if the route isn't otherwise protected — can load the full user list
including names, emails, phone numbers, and roles. There is also an export
button (`listUsersForExport`) on the same page.

None of the mutating actions in `lib/actions/user.actions.ts` check the
caller's session or role either:

- `createUserAsAdmin` — lets the caller set **any role**, including `ADMIN` or
  `OWNER`. This is a direct privilege-escalation primitive if the action is
  reachable (server actions are POST endpoints; a logged-in low-privilege user
  can invoke it).
- `updateUser` — can change any user's `email`, `role`, and `password` by `id`.
- `deleteUser` — can delete any user by `id`.
- `listUsers` / `listUsersForExport` / `searchUser` — expose all PII.

Unlike `booking.actions.ts`, these actions trust the client entirely. **This is
the most serious finding.**

**Fix:** Add a server-side guard at the top of every privileged action and the
`/users` page. For example:

```ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as Role | undefined;
  if (!role || ![Role.ADMIN, Role.OWNER].includes(role)) {
    throw new Error("Not authorized");
  }
  return session;
}
```

Call it in `listUsers`, `listUsersForExport`, `searchUser`, `createUserAsAdmin`,
`updateUser`, `deleteUser`, and gate the `/users` page (redirect to `/signin` or
return 404 for non-admins). Don't rely on hiding the UI — the actions are
independently callable.

### 2. HIGH — No password strength requirement on sign-up

`signUpFormSchema` defines `password: z.string()` with **no minimum length or
complexity**. A user can register with a 1-character password (or empty string).
The edit schema (`userEditFormSchema`) correctly enforces `min 8`, so the
sign-up path is inconsistent and weaker.

**Fix:** Match the edit schema:

```ts
password: z.string().min(8, "Password must be at least 8 characters long"),
```

Consider also rejecting the most common passwords. Validation must live in the
Zod schema (server-validated), not just the form, since `createUser` is a
server action callable directly.

### 3. MEDIUM — Hardcoded default password in the sign-up form

`app/(root)/signup/SignUpForm.tsx` sets `defaultUserValues.password = "12345678"`.
Combined with issue #2 (no strength check), a user who skips the field — or any
automated submit — creates an account with a known, guessable password. Even as
a dev placeholder this is risky and ships to production.

**Fix:** Default the password field to `""` and let validation force a real
entry.

### 4. MEDIUM — No rate limiting / brute-force protection on sign-in

The credentials `authorize` callback runs a bcrypt compare on every attempt with
no throttling, lockout, or CAPTCHA. An attacker can submit unlimited
email/password guesses against `/api/auth/callback/credentials`.

**Fix:** Add rate limiting (e.g. per-IP and per-email) in front of the auth
endpoint — Upstash/Redis token bucket, or middleware. At minimum, add a small
artificial delay and an attempt counter with temporary lockout.

### 5. LOW — `verifyPassword` is exported as a `"use server"` action — ✅ FIXED (2026-06-11)

> **Resolved.** `verifyPassword` (and a new `hashPassword`) now live in
> `lib/password.ts` — a `server-only` module, not a `"use server"` one — so it is
> no longer a callable action endpoint. `lib/auth.ts` imports it from there. This
> also broke an import cycle that would otherwise have formed between
> `lib/auth.ts` → `user.actions.ts` → `auth.actions.ts`. Original below.

`verifyPassword` lived in `user.actions.ts` (a `"use server"` module), so it was
exposed as a callable server action endpoint, not just an internal helper.

### 6. LOW — Broad `as any` session casts

The codebase uses `(session.user as any).role` throughout. This is a
type-safety gap, not a vulnerability, but it makes it easy to misread the
session shape and miss a role check. Consider augmenting the NextAuth
`Session`/`JWT` types so `role` and `isInstructor` are properly typed.

(Note: Next.js server actions have built-in CSRF protection via origin checks,
so no separate CSRF token is needed — recorded for completeness.)

### 7. LOW — Generic "guest" accounts get random-UUID passwords

`createStudent` / `createGuest` hash `crypto.randomUUID()` as the password. This
is fine (effectively unusable credentials), but those accounts have role `KITER`
by default and a real email. If a password-reset flow is added later, ensure
these accounts can't be claimed by someone who knows the email. Not a current
issue — flagging for the roadmap.

## Previously missing — ✅ IMPLEMENTED (2026-06-11)

- **Password reset / forgot-password flow** — added. `/forgot-password` →
  emailed link → `/reset-password`. Tokens are single-use, expiring (1h), and
  stored hashed in the new `PasswordResetToken` table; `requestPasswordReset`
  always returns a generic response to avoid user enumeration. Server actions in
  `lib/actions/auth.actions.ts`.
- **Email verification (non-blocking)** — added. Self-signup now emails a
  verification link (`/verify-email`); unverified signed-in users see a banner
  (`components/auth/EmailVerificationBanner.tsx`) with a resend button. Tokens
  reuse the NextAuth `VerificationToken` table, hashed, 24h expiry.
  Admin-created accounts are auto-verified. Verification is *not* enforced at
  sign-in (by design).
- **Route-level auth** — added as `proxy.ts` (the Next 16 successor to
  `middleware.ts`). It enforces authentication and role at the edge: `/users` is
  admin/owner-only, the rest of the back-office is staff-level, `/my-schedule`
  needs any session. Role tiers are shared via the edge-safe `lib/roles.ts`.

## Remaining priority order

1. Enforce a password minimum length on sign-up (#2) and remove the hardcoded
   default (#3).
2. Add brute-force rate limiting on sign-in and on `requestPasswordReset` (#4).
3. Type the NextAuth session/JWT to remove `as any` casts (#6).

(Issues #1 and #5 are resolved — see above.)
