/**
 * Outreach decision logic.
 *
 * Determines whether the bot should initiate proactive outreach based on:
 *   1. Base minimum interval: 30 minutes
 *   2. Backoff after ignored outreaches (2hr after 1, 6hr after 2, 24hr after 3+)
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

const MINUTES_MS = 60 * 1000;
const HOURS_MS = 60 * MINUTES_MS;

// Base interval: 30 minutes
const BASE_MINIMUM_MS = 30 * MINUTES_MS;

// Backoff tiers
const BACKOFF_1_IGNORED_MS = 2 * HOURS_MS;
const BACKOFF_2_IGNORED_MS = 6 * HOURS_MS;
const BACKOFF_3_PLUS_IGNORED_MS = 24 * HOURS_MS;

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
  let minimumMs = BASE_MINIMUM_MS;

  // Apply backoff for ignored outreaches
  if (!relationshipState.lastOutreachResponded) {
    if (relationshipState.consecutiveIgnoredOutreaches >= 3) {
      minimumMs = BACKOFF_3_PLUS_IGNORED_MS;
    } else if (relationshipState.consecutiveIgnoredOutreaches >= 2) {
      minimumMs = BACKOFF_2_IGNORED_MS;
    } else {
      minimumMs = BACKOFF_1_IGNORED_MS;
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
