# Guest self-service: editing a competition registration

_Part of the King of the Lagoon payment build ([PLAN.MD](PLAN.MD)). Written
2026-09-02 from the code as built._

## What the feature is

A guest who registers at `/compete` never gets an account, a password, or a
session. They still need to finish paying, change their phone number, or pull
out. That is what the **manage page** is for: one private URL, emailed to them,
that opens exactly one registration and offers exactly the actions that are
legal for it right now.

Route: [`/compete/manage/[token]`](manage/%5Btoken%5D/page.tsx). It is
`force-dynamic`, `robots: noindex, nofollow`, and public — `/compete` is a bare
prefix in the [proxy matcher](../../proxy.ts#L63), so nothing under it is behind
auth. Because the prefix is unauthenticated, the staff-facing side of the same
data deliberately lives at `/reservations/compete`, not here.

The design constraint behind everything below: **the link is the credential**,
so the page must never leak more than the holder already knows, and every action
must re-validate on the server. Hidden buttons are not security.

---

## How a guest gets the link

The capability token is 32 random bytes, base64url-encoded
([`issueCompetitionManageToken`](../../lib/competition-tokens.ts#L10)). Only its
SHA-256 digest is stored, in `CompetitionEntry.manageTokenHash` (unique), next
to `manageTokenIssuedAt`. The raw token exists in one place: the emailed URL. It
is never logged and never written into timeline metadata.

Four ways a guest arrives at their page:

1. **Straight after registering.** `registerPaidEntry` returns
   `manageUrl: /compete/manage/<raw token>` and
   [entry-wizard.tsx](entry-wizard.tsx#L441) pushes the browser there, so the
   entrant lands on their own registration without waiting for email.
2. **The email.** [`sendCompetitionManageEmail`](../../lib/email.ts#L24) sends a
   status-appropriate line (waitlisted / offered / pending payment / confirmed)
   plus the link, with the reminder to keep it private.
3. **Self-recovery.** Re-submitting the form with an email that already has an
   entry for this event creates nothing. It rotates the token, re-emails the
   link to the _stored_ address, and returns `recovered: true` — the browser goes
   to `/compete/confirmed?recovery=1`. The response is identical whether or not
   an entry existed, so the form cannot be used to probe who is registered.
   Guarded by a 60-second `manageTokenIssuedAt` check plus
   `rateLimit("compete-recover:<entryId>", 1, 60_000)`.
4. **Staff resend.** [`resendCompetitionManageLink`](../reservations/compete/actions.ts#L530)
   rotates and re-sends under `requireStaff()`, also 1/minute.

Rotation always writes a `MANAGE_TOKEN_ROTATED` timeline event with the reason
(`PUBLIC_RECOVERY` or `STAFF_RESEND`), and it **invalidates the previous link** —
one hash column, one live token per entry.

**Expiry.** [`loadEntryByManageToken`](../../lib/competition-registration.ts#L459)
resolves the hash, and returns `null` once `now > event.endsAt + 30 days`. The
page then renders `notFound()`. An unknown token and an expired token are
indistinguishable to the visitor.

---

## What the page does on load

1. Rate-limits the view itself: `compete-status:<tokenHash>:<ip>`, 30 requests
   per minute. Over the limit renders a polite "please slow down" shell, not the
   registration.
2. Resolves the token; 404s if it is unknown or past its 30-day life.
3. Runs [`expireStaleCompetitionWindows`](../../lib/competition-registration.ts#L240)
   for the event inside a transaction, then **re-reads the entry**. A guest who
   opens the page after their window lapsed sees the expired state, not a live
   "Pay now" button that would fail on click. The scheduled
   [cron route](../api/cron/competition-expiry/route.ts) (`*/15 * * * *`, see
   [vercel.json](../../vercel.json)) does the same sweep for everyone else.
4. Derives what to show from the entry status, the newest payment attempt
   (`paymentAttempts` ordered `sequence desc`), and whether the event is still
   editable.
5. Mounts [`StatusPoller`](manage/%5Btoken%5D/status-poller.tsx) — a
   `router.refresh()` every 5 s — but **only** while a Flash attempt is active.
   That is the one case where an external event (the webhook) changes the page
   without the guest doing anything. InstaPay, waitlist, and finished states do
   not poll.

`readOnly` is the single gate on editing:

```
readOnly = event.status !== "OPEN"
        || !event.registrationCutoffAt
        || now >= event.registrationCutoffAt
```

After the cutoff the page stays reachable and still shows an already-active
payment window (the guest can finish paying a link they were given), but every
form that would _start_ something new is hidden and its server action refuses.

---

## What a guest can change

| Action                                 | Server action               | Allowed when                                                                  |
| -------------------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| Accept a place, pick Flash or InstaPay | `chooseCompetitionPayment`  | status `OFFERED`, before cutoff                                               |
| Open the Flash checkout link           | — (external `https` link)   | attempt is `FLASH` and has a link                                             |
| Re-create a missing Flash link         | `retryFlashPaymentLink`     | active Flash attempt with no `flashPaymentLink`; 2/min                        |
| Switch Flash ↔ InstaPay                | `switchCompetitionPayment`  | status `PENDING_PAYMENT`, an attempt is still active, before cutoff           |
| Refresh a lapsed window                | `refreshCompetitionPayment` | status `WAITLISTED`, newest attempt `EXPIRED` **and** `UNPAID`, before cutoff |
| Edit name / phone / email              | `updateCompetitionContact`  | before cutoff, any status                                                     |
| Withdraw                               | `withdrawCompetitionEntry`  | before cutoff, not already `WITHDRAWN`/`DECLINED`                             |

All of them live in [manage/[token]/actions.ts](manage/%5Btoken%5D/actions.ts),
take the token from a hidden form field, and return
`{ ok: true } | { ok: false; error }`. The page redirects failures back to
itself as `?error=…` and renders the message in a `role="alert"` banner, so a
guest with JavaScript disabled still gets the reason.

Every action first calls the shared `access()` helper, which rejects tokens
shorter than 32 characters and applies `compete-manage:<tokenHash>:<ip>` at
20/minute before touching the database.

### What a guest cannot change

Role, discipline, attendance days, party size, and therefore **the amount owed**
are not editable here. That is deliberate: those all feed
`competitionAmountDue()` and per-discipline capacity, so changing one after a
payment window opened means re-pricing an attempt or moving a reservation
between capacity buckets. Those edits are a staff action on
`/reservations/compete`, where the price-change path is audited and forces
`REVIEW_REQUIRED` rather than silently re-charging. A guest who needs one is
told to contact staff.

---

## How each action stays safe

### Payment actions re-check capacity, not just status

`chooseCompetitionPayment`, `switchCompetitionPayment` and
`refreshCompetitionPayment` all funnel into `createAndProvision` →
[`beginCompetitionPayment`](../../lib/competition-payments.ts#L581), which runs
at `Serializable` isolation and, in order:

- takes the capacity row lock for the entry's bucket
  (`lockCompetitionCapacity` — `FOR UPDATE` on the discipline capacity row, or on
  the event row for spectators), then a `FOR UPDATE` on the entry;
- expires stale windows _inside_ the same transaction;
- re-reads the entry and enforces an **optimistic guard** supplied by the caller:
  `expectedStatus` (`OFFERED` / `PENDING_PAYMENT` / `WAITLISTED`),
  `replaceAttemptId` (the attempt being switched away from must still be
  `ACTIVE`), or `expiredAttemptId` (the newest attempt must still be the expired
  one). A mismatch throws "This registration changed. Refresh and try again."
  rather than acting on stale page state — this is what makes a double-submitted
  form or a stale tab harmless;
- re-checks `capacityAvailable` excluding this entry, and refuses with "That
  place is no longer available." if the bucket filled meanwhile;
- supersedes any remaining `ACTIVE` attempt and creates the new one.

The new attempt carries its own window — 24 h for Flash, 48 h for InstaPay —
the current `paymentTermsVersion` with the acceptance timestamp, and for
InstaPay a fresh `KOL-…` transfer reference plus a **frozen copy** of the bank
destination (`instaPayDestinationCopy`), so the instructions a guest was shown
stay reconstructible even if staff later edit the event settings.

For Flash, `provisionFlashAttempt` then creates the order and stores
`flashOrderId` / `flashPaymentLink`, rejecting any non-`https` link the provider
returns, and writes `FLASH_LINK_CREATED`. If that call fails the attempt still
exists and the page offers **Retry Flash link** instead of a dead button.

When Flash is not configured (`flashCheckoutConfigured()` false) the online
option disappears from the UI _and_ `createAndProvision` throws — the guest is
told online payment is temporarily unavailable and InstaPay still works.

### Contact edits never merge people

[`updateCompetitionContact`](manage/%5Btoken%5D/actions.ts#L246) validates name
(non-empty, ≤120 chars), email (present, contains `@`, lowercased) and phone (at
least 7 digits), then in one transaction:

- takes `pg_advisory_xact_lock` on the normalised phone, so two concurrent edits
  cannot both pass the collision check;
- refuses if the new email or phone belongs to **any other** user — "Those
  details match another person. Please contact staff; registrations are never
  merged automatically." This is the same anti-merge posture as the public
  booking form: an automatic merge here would let anyone with a manage link
  attach themselves to a stranger's user record;
- updates the shared `User` row (the entry never duplicates contact fields);
- appends `CONTACT_UPDATED` with both old and new values.

After commit it emails **both the old and the new address** — so a hijacked link
cannot quietly move a registration to an attacker's inbox without the original
owner being told — and records `EMAIL_SENT` / `EMAIL_FAILED` per recipient.
Delivery failure is logged, never rolled back.

### Withdrawal is honest about money

`withdrawCompetitionEntry` cancels any `ACTIVE` attempt (`CANCELLED`), sets the
entry to `WITHDRAWN`, clears `offerExpiresAt`, and appends `ENTRY_WITHDRAWN`
with `selfService: true`. It is idempotent — withdrawing twice returns `ok`.

It releases capacity, but it does **not** touch `winningPaymentAttemptId`, the
attempt history, or the ledger `PAYMENT` row. A paid entrant can withdraw; no
refund is issued automatically. Refunds stay a money-in staff action recorded as
an external note (v1 boundary in [PLAN.MD](PLAN.MD)).

### Review-required states stop the guest from paying twice

If any attempt settles as `REVIEW_REQUIRED` (wrong amount, late money, entry no
longer eligible), `deriveCompetitionPaymentStatus` surfaces it and the page shows
a red banner: money was received, staff must resolve it, **do not send another
payment**. `refreshCompetitionPayment` also refuses outright when the expired
attempt is not `UNPAID`, so a guest cannot open a second window on top of money
that is already sitting in review.

---

## What the guest's edits leave behind

Every self-service action appends to the append-only `CompetitionEntryEvent`
timeline that staff read on `/reservations/compete`:

`MANAGE_TOKEN_ROTATED`, `PAYMENT_ATTEMPT_CREATED`, `PAYMENT_ATTEMPT_EXPIRED`,
`FLASH_LINK_CREATED`, `FLASH_LINK_FAILED`, `CONTACT_UPDATED` (old + new),
`ENTRY_WITHDRAWN`, `EMAIL_SENT`, `EMAIL_FAILED`.

Metadata is deliberately safe: attempt ids, provider order/transaction ids,
amounts, timestamps. Never the raw manage token, provider credentials, the HMAC
secret, or a raw webhook body.

---

## Known limits

- **Switching restarts the clock.** A switch supersedes the active attempt and
  creates a new one with a full 24 h/48 h window, so alternating methods extends
  the hold on a place. Acceptable while cutoff and staff oversight bound it;
  worth a cap if a full event shows abuse.
- **One live link per entry.** Rotating for recovery or a staff resend breaks the
  link already in the guest's inbox. That is the intended trade (a stolen old
  link dies), but support should expect "the link in my email stopped working"
  after a resend.
- **Polling only covers Flash.** An InstaPay guest sees confirmation only after
  reloading, because settlement happens when staff record the transfer.
- **Email is best-effort.** Failures are recorded and surfaced to staff for a
  guarded resend; they never roll back a registration or a payment.
- **No age, waiver, or eligibility edits** are exposed here — out of scope in v1.

---

## Verifying it

- `npm run test:compete-payments` — token issue/hash round-trip, the 30-day
  expiry boundary, derived payment states, amounts, Flash HMAC.
- `npm run test:flash-webhook` — signed-callback handling end to end.
- Manual pass before opening the event: register → land on the manage page →
  switch method → let a window expire → refresh it → change email (check both
  inboxes) → withdraw. Then confirm the timeline on `/reservations/compete`
  tells that whole story back, and that the raw token appears in no log.

Deployment prerequisites (Flash secrets, `CRON_SECRET`, `RESEND_API_KEY` /
`EMAIL_FROM`) are in
[docs/competition-payment-operations.md](../../docs/competition-payment-operations.md).
