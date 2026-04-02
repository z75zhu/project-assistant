// Feature: discord-relationship-bot, Property 2: File update preservation invariant
// **Validates: Requirements 2.5**

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

const PLACEHOLDER_PATTERNS = [
  /^\(None discovered yet\)$/,
  /^\(Nothing yet — we just met!\)$/,
  /^\(Still figuring out how they like to talk\)$/,
  /^\(Empty.*\)$/,
  /^-\s*Everything else:\s*still learning!$/,
];

function isPlaceholder(line: string): boolean {
  const trimmed = line.trim();
  return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

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

describe('Property 2: File update preservation invariant', () => {
  it('all non-placeholder lines from original are preserved in append mode', () => {
    fc.assert(
      fc.property(
        fc.array(factArb, { minLength: 1, maxLength: 5 }),
        (facts) => {
          const { updatedUserMd } = updateUser({
            facts,
            currentUserMd: DEFAULT_USER_MD,
            mode: 'append',
          });

          const originalLines = DEFAULT_USER_MD.split('\n');
          for (const line of originalLines) {
            if (line.trim() === '') continue;
            if (isPlaceholder(line)) continue;
            // The stable facts count line gets incremented, so check the key portion
            if (line.includes('Stable facts learned:')) {
              expect(updatedUserMd).toContain('Stable facts learned:');
              continue;
            }
            expect(updatedUserMd).toContain(line);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('section headings are never removed by append operations', () => {
    fc.assert(
      fc.property(
        fc.array(factArb, { minLength: 1, maxLength: 5 }),
        (facts) => {
          const { updatedUserMd } = updateUser({
            facts,
            currentUserMd: DEFAULT_USER_MD,
            mode: 'append',
          });

          expect(updatedUserMd).toContain('# About My Owner');
          expect(updatedUserMd).toContain('## Basic Info');
          expect(updatedUserMd).toContain('## Interests');
          expect(updatedUserMd).toContain('## Important Things They\'ve Shared');
          expect(updatedUserMd).toContain('## Communication Preferences');
          expect(updatedUserMd).toContain('## Relationship');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('relationship metadata lines are preserved in append mode', () => {
    fc.assert(
      fc.property(
        fc.array(factArb, { minLength: 1, maxLength: 5 }),
        (facts) => {
          const { updatedUserMd } = updateUser({
            facts,
            currentUserMd: DEFAULT_USER_MD,
            mode: 'append',
          });

          expect(updatedUserMd).toContain('Stage: early');
          expect(updatedUserMd).toContain('Sessions completed: 0');
          expect(updatedUserMd).toContain('Last outreach at: never');
          expect(updatedUserMd).toContain('Consecutive ignored outreaches: 0');
        }
      ),
      { numRuns: 100 }
    );
  });
});
