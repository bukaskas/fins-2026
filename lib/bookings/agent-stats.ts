import {
  BookingContactOutcome,
  BookingEventSource,
  BookingStatus,
  Role,
} from "@prisma/client";

/**
 * The arithmetic behind /bookings/agents, kept free of database and session
 * access so the rules read in one place.
 *
 * The page is a coaching and workload view, not a pay basis:
 *
 * - A confirmed booking belongs to its owner (`agentId`), which is set once —
 *   by the staff creator, else by the first confirmation. No owner means no
 *   staff member was involved: the booking is reported as self-serve.
 * - A booking that never got confirmed has no owner, so it is carried by its
 *   handler: a manually assigned owner, else the first staff member to act on
 *   it (a status change or a logged contact).
 * - Conversion is won / (won + lost). Staff declines are a correct decision
 *   (a full date), so they are shown but left out. A cancellation after
 *   confirmation was still won.
 */

export const CONFIRMED_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.ARRIVED,
];
// Active but not yet confirmed — counted separately from confirmed on the
// dashboard calendar.
export const ACTIVE_PENDING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.REQUEST_SENT,
  BookingStatus.UNDER_REVIEW,
  BookingStatus.WAITING_PAYMENT,
];
export const DECLINED_STATUSES: BookingStatus[] = [
  BookingStatus.DECLINED,
  BookingStatus.NO_RESPONSE_EXPIRED,
  BookingStatus.CANCELED,
];

/** Roles that work the booking desk and are listed even with nothing to show. */
const ALWAYS_LISTED_ROLES: Role[] = [Role.STAFF, Role.RECEPTION];

/** Below this many decided bookings a conversion rate is noise, not a signal. */
export const MIN_DECIDED_FOR_CONVERSION = 5;

/** A contact that did not reach the guest is overdue for a retry after this. */
const FOLLOW_UP_AFTER_MS = 24 * 60 * 60 * 1000;

export const SELF_SERVE_KEY = "self-serve";

export type AgentStatsBooking = {
  agentId: string | null;
  service: string;
  bookingStatus: BookingStatus;
  totalPriceCents: number | null;
  amountPaidCents: number;
  createdAt: Date;
  events: {
    source: BookingEventSource;
    actorId: string | null;
    fromStatus: BookingStatus | null;
    toStatus: BookingStatus | null;
    createdAt: Date;
  }[];
  contacts: { actorId: string | null; createdAt: Date }[];
};

export type AgentStatsUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
};

/** The latest contact on a booking that is still open. */
export type AgentStatsOpenContact = {
  actorId: string | null;
  outcome: BookingContactOutcome;
  createdAt: Date;
  nextContactAt: Date | null;
};

export type AgentStatsRow = {
  /** Agent id, or `SELF_SERVE_KEY`. */
  key: string;
  agentId: string | null;
  name: string;
  /** Currently CONFIRMED or ARRIVED. */
  confirmedCount: number;
  /** Confirmed once, cancelled since — still won for conversion. */
  cancelledAfterConfirmCount: number;
  /** Expired or auto-cancelled before confirmation. */
  lostCount: number;
  /** Turned down by staff; excluded from conversion. */
  declinedCount: number;
  /** Still in progress. */
  openCount: number;
  /** Booked value of priced confirmed bookings. */
  revenueCents: number;
  /** Unpaid balance on those same bookings. */
  outstandingCents: number;
  pricedCount: number;
  /** Confirmed with no usable price (null, or corporate's deposit-only total). */
  unpricedCount: number;
  /** Median time from a guest's request to this agent acting on it first. */
  medianFirstResponseMs: number | null;
  contactsLogged: number;
  overdueFollowUps: number;
};

export type AgentStatsTeam = {
  totalBookings: number;
  confirmedCount: number;
  cancelledAfterConfirmCount: number;
  lostCount: number;
  declinedCount: number;
  /** Open with no owner and no staff action yet. */
  openUntouched: number;
  openInProgress: number;
  /** null below `MIN_DECIDED_FOR_CONVERSION`. */
  conversionRate: number | null;
  revenueCents: number;
  outstandingCents: number;
  unpricedCount: number;
  serviceBreakdown: Record<string, number>;
};

export type AgentStatsResult = {
  team: AgentStatsTeam;
  /** The same figures for the period before; null for "all time". */
  previous: AgentStatsTeam | null;
  perAgent: AgentStatsRow[];
  /** "self" when the viewer only sees their own row. */
  scope: "team" | "self";
  /** When history recording began; response times exist from here on. */
  trackingSince: Date | null;
};

export function conversionRate(row: {
  confirmedCount: number;
  cancelledAfterConfirmCount: number;
  lostCount: number;
}): number | null {
  const won = row.confirmedCount + row.cancelledAfterConfirmCount;
  const decided = won + row.lostCount;
  return decided >= MIN_DECIDED_FOR_CONVERSION ? won / decided : null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function isOverdue(contact: AgentStatsOpenContact, now: Date): boolean {
  if (contact.nextContactAt) return contact.nextContactAt < now;
  return (
    contact.outcome !== BookingContactOutcome.REACHED &&
    now.getTime() - contact.createdAt.getTime() > FOLLOW_UP_AFTER_MS
  );
}

export function buildAgentStats(input: {
  bookings: AgentStatsBooking[];
  users: AgentStatsUser[];
  /** Contacts logged in the range, per actor. */
  contactsByActor: Map<string, number>;
  openContacts: AgentStatsOpenContact[];
  trackingSince: Date | null;
  now: Date;
}): { team: AgentStatsTeam; perAgent: AgentStatsRow[] } {
  const { bookings, users, contactsByActor, openContacts, trackingSince, now } = input;

  const usersById = new Map(users.map((u) => [u.id, u]));
  const rows = new Map<string, AgentStatsRow>();
  const responseTimes = new Map<string, number[]>();

  const rowFor = (key: string): AgentStatsRow => {
    let row = rows.get(key);
    if (!row) {
      const user = usersById.get(key);
      row = {
        key,
        agentId: key === SELF_SERVE_KEY ? null : key,
        name:
          key === SELF_SERVE_KEY
            ? "Self-serve"
            : user?.name || user?.email || "Former staff",
        confirmedCount: 0,
        cancelledAfterConfirmCount: 0,
        lostCount: 0,
        declinedCount: 0,
        openCount: 0,
        revenueCents: 0,
        outstandingCents: 0,
        pricedCount: 0,
        unpricedCount: 0,
        medianFirstResponseMs: null,
        contactsLogged: 0,
        overdueFollowUps: 0,
      };
      rows.set(key, row);
    }
    return row;
  };

  for (const u of users) {
    if (ALWAYS_LISTED_ROLES.includes(u.role)) rowFor(u.id);
  }

  const team: AgentStatsTeam = {
    totalBookings: bookings.length,
    confirmedCount: 0,
    cancelledAfterConfirmCount: 0,
    lostCount: 0,
    declinedCount: 0,
    openUntouched: 0,
    openInProgress: 0,
    conversionRate: null,
    revenueCents: 0,
    outstandingCents: 0,
    unpricedCount: 0,
    serviceBreakdown: {},
  };

  for (const b of bookings) {
    team.serviceBreakdown[b.service] = (team.serviceBreakdown[b.service] ?? 0) + 1;

    const statusEvents = b.events
      .filter((e) => e.toStatus !== null)
      .sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime());
    const createdByStaff = statusEvents.some(
      (e) => e.fromStatus === null && e.source === BookingEventSource.STAFF,
    );

    // The first thing any staff member did: a status change or a logged contact.
    const staffActions = [
      ...statusEvents.filter((e) => e.source === BookingEventSource.STAFF),
      ...b.contacts,
    ]
      .filter((a): a is typeof a & { actorId: string } => a.actorId !== null)
      .sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime());
    const firstAction = staffActions[0] ?? null;
    const handlerId = b.agentId ?? firstAction?.actorId ?? null;

    if (
      firstAction &&
      !createdByStaff &&
      trackingSince &&
      b.createdAt >= trackingSince
    ) {
      const times = responseTimes.get(firstAction.actorId) ?? [];
      times.push(firstAction.createdAt.getTime() - b.createdAt.getTime());
      responseTimes.set(firstAction.actorId, times);
      rowFor(firstAction.actorId);
    }

    if (CONFIRMED_STATUSES.includes(b.bookingStatus)) {
      const row = rowFor(b.agentId ?? SELF_SERVE_KEY);
      row.confirmedCount += 1;
      team.confirmedCount += 1;
      // Corporate stores only the deposit owed as its total, so it has no
      // booked value to report.
      if (b.totalPriceCents === null || b.service === "corporate") {
        row.unpricedCount += 1;
        team.unpricedCount += 1;
      } else {
        const outstanding = Math.max(b.totalPriceCents - b.amountPaidCents, 0);
        row.pricedCount += 1;
        row.revenueCents += b.totalPriceCents;
        row.outstandingCents += outstanding;
        team.revenueCents += b.totalPriceCents;
        team.outstandingCents += outstanding;
      }
      continue;
    }

    if (ACTIVE_PENDING_STATUSES.includes(b.bookingStatus)) {
      if (handlerId) {
        rowFor(handlerId).openCount += 1;
        team.openInProgress += 1;
      } else {
        team.openUntouched += 1;
      }
      continue;
    }

    const wasConfirmed = statusEvents.some(
      (e) => e.toStatus !== null && CONFIRMED_STATUSES.includes(e.toStatus),
    );
    if (wasConfirmed) {
      rowFor(b.agentId ?? SELF_SERVE_KEY).cancelledAfterConfirmCount += 1;
      team.cancelledAfterConfirmCount += 1;
      continue;
    }

    // A cancellation a staff member made is a decision, like a decline; one the
    // cron made (or one with no history) is a lead that ran out.
    const lastStatusEvent = statusEvents[statusEvents.length - 1];
    const staffDecision =
      b.bookingStatus === BookingStatus.DECLINED ||
      (b.bookingStatus === BookingStatus.CANCELED &&
        lastStatusEvent?.source === BookingEventSource.STAFF);
    if (staffDecision) {
      if (handlerId) rowFor(handlerId).declinedCount += 1;
      team.declinedCount += 1;
    } else {
      // With no handler nobody picked it up: it counts for the team only.
      if (handlerId) rowFor(handlerId).lostCount += 1;
      team.lostCount += 1;
    }
  }

  for (const [actorId, count] of contactsByActor) {
    rowFor(actorId).contactsLogged = count;
  }
  for (const contact of openContacts) {
    if (contact.actorId && isOverdue(contact, now)) {
      rowFor(contact.actorId).overdueFollowUps += 1;
    }
  }
  for (const [actorId, times] of responseTimes) {
    rowFor(actorId).medianFirstResponseMs = median(times);
  }

  team.conversionRate = conversionRate(team);

  const perAgent = Array.from(rows.values()).sort((a, b) => {
    if (a.key === SELF_SERVE_KEY) return 1;
    if (b.key === SELF_SERVE_KEY) return -1;
    return b.confirmedCount - a.confirmedCount || a.name.localeCompare(b.name);
  });

  return { team, perAgent };
}
