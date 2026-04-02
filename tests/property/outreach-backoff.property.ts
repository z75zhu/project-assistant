// Feature: discord-relationship-bot, Property 4: Outreach backoff on ignored messages
// **Validates: Requirements 3.5, 3.6**

import * as fc from 'fast-check';
import { decideOutreach, RelationshipState } from '../../lib/decide-outreach';

const HOURS_MS = 60 * 60 * 1000;
const BACKOFF_1 = 2 * HOURS_MS;
const BACKOFF_2 = 6 * HOURS_MS;
const BACKOFF_3 = 24 * HOURS_MS;

const stageArb = fc.constantFrom<RelationshipState['stage']>('early', 'developing', 'established');
const NON_EMPTY_CONTEXT = 'Owner mentioned they love board games';

describe('Property 4: Outreach backoff on ignored messages', () => {
  it('should enforce 2hr cooldown when 1 outreach was ignored', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (stage, currentTime) => {
          const elapsed = Math.floor(Math.random() * BACKOFF_1);
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
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce 6hr cooldown when 2 outreaches were ignored', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (stage, currentTime) => {
          const elapsed = Math.floor(Math.random() * BACKOFF_2);
          const lastOutreachAt = new Date(currentTime.getTime() - elapsed);

          const state: RelationshipState = {
            stage,
            sessionsCompleted: 15,
            stableFactsLearned: 10,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: false,
            consecutiveIgnoredOutreaches: 2,
            exchangesSinceLastSoulUpdate: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          expect(decision.shouldReachOut).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce 24hr cooldown when 3+ outreaches were ignored', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.integer({ min: 3, max: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (stage, consecutiveIgnores, currentTime) => {
          const elapsed = Math.floor(Math.random() * BACKOFF_3);
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
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow outreach after backoff period expires', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-01') }),
        (stage, baseTime) => {
          // 1 ignored, wait full 2hr + extra
          const elapsed = BACKOFF_1 + HOURS_MS;
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
});
