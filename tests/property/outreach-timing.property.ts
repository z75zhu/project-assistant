// Feature: discord-relationship-bot, Property 3: Outreach timing
// **Validates: Requirements 3.2, 3.3**

import * as fc from 'fast-check';
import { decideOutreach, RelationshipState } from '../../lib/decide-outreach';

const MINUTES_MS = 60 * 1000;
const BASE_MINIMUM_MS = 30 * MINUTES_MS;

const stageArb = fc.constantFrom<RelationshipState['stage']>('early', 'developing', 'established');
const NON_EMPTY_CONTEXT = 'Owner likes hiking and coding';

describe('Property 3: Outreach timing', () => {
  it('should return shouldReachOut=false when elapsed time is less than 30 minutes', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (stage, baseTime) => {
          // Elapsed less than 30 min
          const elapsed = Math.floor(Math.random() * BASE_MINIMUM_MS);
          const lastOutreachAt = new Date(baseTime.getTime() - elapsed);

          const state: RelationshipState = {
            stage,
            sessionsCompleted: 5,
            stableFactsLearned: 3,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: true,
            consecutiveIgnoredOutreaches: 0,
            exchangesSinceLastSoulUpdate: 0,
          };

          const decision = decideOutreach({
            relationshipState: state,
            currentTime: baseTime,
            ownerContext: NON_EMPTY_CONTEXT,
          });

          expect(decision.shouldReachOut).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return shouldReachOut=true when elapsed time meets 30 minutes and owner responded', () => {
    fc.assert(
      fc.property(
        stageArb,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-01') }),
        fc.integer({ min: 0, max: 48 }),
        (stage, baseTime, extraMinutes) => {
          const elapsed = BASE_MINIMUM_MS + extraMinutes * MINUTES_MS;
          const lastOutreachAt = new Date(baseTime.getTime() - elapsed);

          const state: RelationshipState = {
            stage,
            sessionsCompleted: 5,
            stableFactsLearned: 3,
            lastOutreachAt: lastOutreachAt.toISOString(),
            lastOutreachResponded: true,
            consecutiveIgnoredOutreaches: 0,
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
