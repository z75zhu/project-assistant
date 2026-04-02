// Feature: discord-relationship-bot, Property 3: Stage-based outreach timing
// **Validates: Requirements 3.2, 3.3**

import * as fc from 'fast-check';
import { decideOutreach, RelationshipState } from '../../lib/decide-outreach';

const HOURS_MS = 60 * 60 * 1000;

const STAGE_MINIMUMS: Record<RelationshipState['stage'], number> = {
  early: 4,
  developing: 8,
  established: 24,
};

const stageArb = fc.constantFrom<RelationshipState['stage']>('early', 'developing', 'established');

/** Build a relationship state that has responded to the last outreach (no backoff). */
function respondedStateArb(stage: fc.Arbitrary<RelationshipState['stage']>) {
  return fc.record({
    stage,
    sessionsCompleted: fc.nat({ max: 100 }),
    stableFactsLearned: fc.nat({ max: 50 }),
    lastOutreachAt: fc.constant(null as string | null), // overridden per-test
    lastOutreachResponded: fc.constant(true),
    consecutiveIgnoredOutreaches: fc.constant(0),
    exchangesSinceLastSoulUpdate: fc.nat({ max: 50 }),
  });
}

const NON_EMPTY_CONTEXT = 'Owner likes hiking and coding';

describe('Property 3: Stage-based outreach timing', () => {
  it('should return shouldReachOut=false when elapsed time is less than stage minimum', () => {
    fc.assert(
      fc.property(
        stageArb,
        respondedStateArb(stageArb),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (stage, baseState, baseTime) => {
          const minimumMs = STAGE_MINIMUMS[stage] * HOURS_MS;
          // Place lastOutreachAt so that elapsed is strictly less than the minimum
          // elapsed = currentTime - lastOutreachAt, so lastOutreachAt = currentTime - elapsed
          // Pick an elapsed between 0 and minimumMs - 1
          const elapsed = Math.floor(Math.random() * minimumMs); // 0 .. minimumMs-1
          const lastOutreachAt = new Date(baseTime.getTime() - elapsed);

          const state: RelationshipState = {
            ...baseState,
            stage,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: true,
            consecutiveIgnoredOutreaches: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime: baseTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          expect(decision.shouldReachOut).toBe(false);
          expect(decision.skipReason).toBe('too soon');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return shouldReachOut=true when elapsed time meets or exceeds stage minimum', () => {
    fc.assert(
      fc.property(
        stageArb,
        respondedStateArb(stageArb),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-01') }),
        fc.integer({ min: 0, max: 48 }),
        (stage, baseState, baseTime, extraHours) => {
          const minimumMs = STAGE_MINIMUMS[stage] * HOURS_MS;
          const elapsed = minimumMs + extraHours * HOURS_MS;
          const lastOutreachAt = new Date(baseTime.getTime() - elapsed);

          const state: RelationshipState = {
            ...baseState,
            stage,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: true,
            consecutiveIgnoredOutreaches: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime: baseTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          expect(decision.shouldReachOut).toBe(true);
          expect(decision.reason).toBe(NON_EMPTY_CONTEXT);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce correct minimum per stage: early=4h, developing=8h, established=24h', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (stage, currentTime) => {
          const minimumMs = STAGE_MINIMUMS[stage] * HOURS_MS;

          // Just under the minimum → should NOT reach out
          const justUnder = new Date(currentTime.getTime() - minimumMs + 1000);
          const stateUnder: RelationshipState = {
            stage,
            sessionsCompleted: 5,
            stableFactsLearned: 3,
            lastOutreachAt: justUnder.toISOString(),
            lastOutreachResponded: true,
            consecutiveIgnoredOutreaches: 0,
            exchangesSinceLastSoulUpdate: 0,
          };

          const decisionUnder = decideOutreach({
            relationshipState: stateUnder,
            currentTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });
          expect(decisionUnder.shouldReachOut).toBe(false);

          // Exactly at the minimum → should reach out
          const exactlyAt = new Date(currentTime.getTime() - minimumMs);
          const stateAt: RelationshipState = {
            ...stateUnder,
            lastOutreachAt: exactlyAt.toISOString(),
          };

          const decisionAt = decideOutreach({
            relationshipState: stateAt,
            currentTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });
          expect(decisionAt.shouldReachOut).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
