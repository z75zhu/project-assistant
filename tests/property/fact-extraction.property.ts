// Feature: discord-relationship-bot, Property 1: Fact extraction persists to USER.md
// **Validates: Requirements 1.2, 2.2**

import * as fc from 'fast-check';
import { updateUser, OwnerFact, FactCategory } from '../../skills/identity-evolution/scripts/update-user';

const DEFAULT_USER_MD = `# About My Owner

## Basic Info
- Discord username: cm6550
- Everything else: still learning!

## Interests
(None discovered yet)

## Important Things They've Shared
(Nothing yet — we just met!)

## Communication Preferences
(Still figuring out how they like to talk)

## Relationship
- Stage: early
- Sessions completed: 0
- Stable facts learned: 0
- Last outreach at: never
- Last outreach responded: n/a
- Consecutive ignored outreaches: 0
- Exchanges since last soul update: 0`;

const CATEGORIES: FactCategory[] = [
  'basic_info',
  'interests',
  'important_events',
  'communication_prefs',
];

const factArb: fc.Arbitrary<OwnerFact> = fc.record({
  key: fc.stringMatching(/^[a-z][a-z_]{2,15}$/),
  value: fc.stringMatching(/^[A-Za-z0-9 ]{3,30}$/),
  category: fc.constantFrom(...CATEGORIES),
  priority: fc.constantFrom('normal' as const, 'high' as const),
});

describe('Property 1: Fact extraction persists to USER.md', () => {
  it('every appended fact key and value should appear in the output', () => {
    fc.assert(
      fc.property(
        fc.array(factArb, { minLength: 1, maxLength: 5 }),
        (facts) => {
          const { updatedUserMd, factsAdded } = updateUser({
            facts,
            currentUserMd: DEFAULT_USER_MD,
            mode: 'append',
          });

          expect(factsAdded).toBe(facts.length);

          for (const fact of facts) {
            expect(updatedUserMd).toContain(fact.key);
            expect(updatedUserMd).toContain(fact.value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('existing content like Discord username is preserved after appending', () => {
    fc.assert(
      fc.property(
        fc.array(factArb, { minLength: 1, maxLength: 5 }),
        (facts) => {
          const { updatedUserMd } = updateUser({
            facts,
            currentUserMd: DEFAULT_USER_MD,
            mode: 'append',
          });

          expect(updatedUserMd).toContain('Discord username: cm6550');
          expect(updatedUserMd).toContain('# About My Owner');
          expect(updatedUserMd).toContain('## Basic Info');
          expect(updatedUserMd).toContain('## Interests');
          expect(updatedUserMd).toContain('## Relationship');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('factsAdded count matches the number of input facts', () => {
    fc.assert(
      fc.property(
        fc.array(factArb, { minLength: 1, maxLength: 10 }),
        (facts) => {
          const { factsAdded } = updateUser({
            facts,
            currentUserMd: DEFAULT_USER_MD,
            mode: 'append',
          });

          expect(factsAdded).toBe(facts.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
