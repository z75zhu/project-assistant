// Feature: discord-relationship-bot, Property 4: Outreach backoff on ignored messages
// **Validates: Requirements 3.5, 3.6**

import * as fc from 'fast-check';
import { decideOutreach, RelationshipState } from '../../lib/decide-outreach';

const HOURS_MS = 60 * 60 * 1000;

const BACKOFF_SINGLE_HOURS = 12;
const BACKOFF_CONSECUTIVE_HOURS = 48;

const stageArb = fc.constantFrom<RelationshipState['stage']>('early', 'developing', 'established');

const NON_EMPTY_CONTEXT = 'Owner mentioned they love board games';

describe('Property 4: Outreach backoff on ignored messages', () => {
  it('should enforce 12hr cooldown when last outreach was ignored (1 consecutive ignore)', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (stage, currentTime) => {
          const backoffMs = BACKOFF_SINGLE_HOURS * HOURS_MS;

          // Place last outreach so elapsed is less than 12hr
          const elapsed = Math.floor(Math.random() * backoffMs);
          const lastOutreachAt = new Date(currentTime.getTime() - elapsed);

          const state: RelationshipState = {
            stage,
            sessionsCompleted: 5,
            stableFactsLearned: 3,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: false,
            consecutiveIgnoredOutreaches: 1,
            exchangesSinceLastSoulUpdate: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          expect(decision.shouldReachOut).toBe(false);
          expect(decision.skipReason).toBe('too soon');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce 48hr cooldown when 2+ consecutive outreaches were ignored', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.integer({ min: 2, max: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (stage, consecutiveIgnores, currentTime) => {
          const backoffMs = BACKOFF_CONSECUTIVE_HOURS * HOURS_MS;

          // Place last outreach so elapsed is less than 48hr
          const elapsed = Math.floor(Math.random() * backoffMs);
          const lastOutreachAt = new Date(currentTime.getTime() - elapsed);

          const state: RelationshipState = {
            stage,
            sessionsCompleted: 15,
            stableFactsLearned: 10,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: false,
            consecutiveIgnoredOutreaches: consecutiveIgnores,
            exchangesSinceLastSoulUpdate: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          expect(decision.shouldReachOut).toBe(false);
          expect(decision.skipReason).toBe('too soon');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow outreach after effective cooldown with 1 ignored outreach', () => {
    const STAGE_MINIMUMS: Record<RelationshipState['stage'], number> = {
      early: 4,
      developing: 8,
      established: 24,
    };

    fc.assert(
      fc.property(
        stageArb,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-01') }),
        fc.integer({ min: 0, max: 48 }),
        (stage, baseTime, extraHours) => {
          // Effective minimum is max(stageMinimum, 12hr backoff)
          const effectiveMs = Math.max(STAGE_MINIMUMS[stage], BACKOFF_SINGLE_HOURS) * HOURS_MS;
          const elapsed = effectiveMs + extraHours * HOURS_MS;
          const lastOutreachAt = new Date(baseTime.getTime() - elapsed);

          const state: RelationshipState = {
            stage,
            sessionsCompleted: 5,
            stableFactsLearned: 3,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: false,
            consecutiveIgnoredOutreaches: 1,
            exchangesSinceLastSoulUpdate: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime: baseTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          expect(decision.shouldReachOut).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow outreach after effective cooldown with 2+ ignored outreaches', () => {
    const STAGE_MINIMUMS: Record<RelationshipState['stage'], number> = {
      early: 4,
      developing: 8,
      established: 24,
    };

    fc.assert(
      fc.property(
        stageArb,
        fc.integer({ min: 2, max: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-01') }),
        fc.integer({ min: 0, max: 48 }),
        (stage, consecutiveIgnores, baseTime, extraHours) => {
          // Effective minimum is max(stageMinimum, 48hr backoff)
          const effectiveMs = Math.max(STAGE_MINIMUMS[stage], BACKOFF_CONSECUTIVE_HOURS) * HOURS_MS;
          const elapsed = effectiveMs + extraHours * HOURS_MS;
          const lastOutreachAt = new Date(baseTime.getTime() - elapsed);

          const state: RelationshipState = {
            stage,
            sessionsCompleted: 15,
            stableFactsLearned: 10,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: false,
            consecutiveIgnoredOutreaches: consecutiveIgnores,
            exchangesSinceLastSoulUpdate: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime: baseTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          expect(decision.shouldReachOut).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use the larger of stage minimum and backoff cooldown', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (currentTime) => {
          // "established" stage has 24hr minimum, which is larger than 12hr backoff
          // So with 1 ignored outreach, the effective minimum should be 24hr (not 12hr)
          const effectiveMs = 24 * HOURS_MS; // max(24h, 12h) = 24h

          // Elapsed is 13 hours — past 12hr backoff but under 24hr stage minimum
          const elapsed = 13 * HOURS_MS;
          const lastOutreachAt = new Date(currentTime.getTime() - elapsed);

          const state: RelationshipState = {
            stage: 'established',
            sessionsCompleted: 40,
            stableFactsLearned: 20,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: false,
            consecutiveIgnoredOutreaches: 1,
            exchangesSinceLastSoulUpdate: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          // 13hr < 24hr → should NOT reach out even though 13hr > 12hr backoff
          expect(decision.shouldReachOut).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
