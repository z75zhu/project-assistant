/**
 * Outreach decision logic.
 *
 * Determines whether the bot should initiate proactive outreach based on:
 *   1. Stage-based minimum intervals (early: 4hr, developing: 8hr, established: 24hr)
 *   2. Backoff after ignored outreaches (12hr after 1, 48hr after 2+)
 *   3. Whether there is meaningful owner context to motivate the outreach
 *
 * Requirements: 3.2, 3.3, 3.5, 3.6, 3.7
 */

export interface RelationshipState {
  stage: "early" | "developing" | "established";
  sessionsCompleted: number;
  stableFactsLearned: number;
  lastOutreachAt: string | null;
  lastOutreachResponded: boolean;
  consecutiveIgnoredOutreaches: number;
  exchangesSinceLastSoulUpdate: number;
}

export interface OutreachDecision {
  shouldReachOut: boolean;
  reason: string | null;
  skipReason: string | null;
  nextEligibleAt: string;
}

const HOURS_MS = 60 * 60 * 1000;

const STAGE_MINIMUM_HOURS: Record<RelationshipState["stage"], number> = {
  early: 4,
  developing: 8,
  established: 24,
};

const BACKOFF_SINGLE_HOURS = 12;
const BACKOFF_CONSECUTIVE_HOURS = 48;

export function decideOutreach(input: {
  relationshipState: RelationshipState;
  currentTime: Date;
  ownerContext: string | null | undefined;
}): OutreachDecision {
  const { relationshipState, currentTime, ownerContext } = input;
  const now = currentTime.getTime();

  // First outreach ever — eligible if we have context
  if (relationshipState.lastOutreachAt === null) {
    if (!ownerContext || ownerContext.trim() === "") {
      return {
        shouldReachOut: false,
        reason: null,
        skipReason: "no context",
        nextEligibleAt: currentTime.toISOString(),
      };
    }
    return {
      shouldReachOut: true,
      reason: ownerContext.trim(),
      skipReason: null,
      nextEligibleAt: currentTime.toISOString(),
    };
  }

  const lastOutreach = new Date(relationshipState.lastOutreachAt).getTime();
  const elapsed = now - lastOutreach;

  // Determine the effective minimum interval
  let minimumMs = STAGE_MINIMUM_HOURS[relationshipState.stage] * HOURS_MS;

  // Apply backoff for ignored outreaches
  if (!relationshipState.lastOutreachResponded) {
    if (relationshipState.consecutiveIgnoredOutreaches >= 2) {
      minimumMs = Math.max(minimumMs, BACKOFF_CONSECUTIVE_HOURS * HOURS_MS);
    } else {
      minimumMs = Math.max(minimumMs, BACKOFF_SINGLE_HOURS * HOURS_MS);
    }
  }

  const nextEligibleAt = new Date(lastOutreach + minimumMs).toISOString();

  // Not enough time has passed
  if (elapsed < minimumMs) {
    return {
      shouldReachOut: false,
      reason: null,
      skipReason: "too soon",
      nextEligibleAt,
    };
  }

  // No meaningful context to motivate outreach
  if (!ownerContext || ownerContext.trim() === "") {
    return {
      shouldReachOut: false,
      reason: null,
      skipReason: "no context",
      nextEligibleAt,
    };
  }

  return {
    shouldReachOut: true,
    reason: ownerContext.trim(),
    skipReason: null,
    nextEligibleAt,
  };
}
