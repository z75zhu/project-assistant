// Feature: discord-relationship-bot, Property 5: Relationship stage classification
// **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

import * as fc from 'fast-check';
import { classifyStage } from '../../skills/identity-evolution/scripts/classify-stage';

describe('Property 5: Relationship stage classification', () => {
  it('should always return one of "early", "developing", or "established"', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100 }),
        fc.nat({ max: 50 }),
        fc.boolean(),
        (sessionCount, stableFactCount, soulComplete) => {
          const { stage } = classifyStage({ sessionCount, stableFactCount, soulComplete });
          expect(['early', 'developing', 'established']).toContain(stage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "early" when sessions < 10', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 9 }),
        fc.nat({ max: 50 }),
        fc.boolean(),
        (sessionCount, stableFactCount, soulComplete) => {
          const { stage } = classifyStage({ sessionCount, stableFactCount, soulComplete });
          expect(stage).toBe('early');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "developing" when sessions 10-30 AND facts >= 10', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 30 }),
        fc.integer({ min: 10, max: 50 }),
        fc.boolean(),
        (sessionCount, stableFactCount, soulComplete) => {
          const { stage } = classifyStage({ sessionCount, stableFactCount, soulComplete });
          expect(stage).toBe('developing');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "early" when sessions 10-30 AND facts < 10', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 30 }),
        fc.nat({ max: 9 }),
        fc.boolean(),
        (sessionCount, stableFactCount, soulComplete) => {
          const { stage } = classifyStage({ sessionCount, stableFactCount, soulComplete });
          expect(stage).toBe('early');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "established" when sessions > 30 AND soulComplete', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 31, max: 100 }),
        fc.nat({ max: 50 }),
        (sessionCount, stableFactCount) => {
          const { stage } = classifyStage({ sessionCount, stableFactCount, soulComplete: true });
          expect(stage).toBe('established');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "developing" when sessions > 30 AND !soulComplete', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 31, max: 100 }),
        fc.nat({ max: 50 }),
        (sessionCount, stableFactCount) => {
          const { stage } = classifyStage({ sessionCount, stableFactCount, soulComplete: false });
          expect(stage).toBe('developing');
        }
      ),
      { numRuns: 100 }
    );
  });
});
