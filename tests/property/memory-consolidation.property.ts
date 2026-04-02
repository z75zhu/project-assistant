// Feature: discord-relationship-bot, Property 7: Memory consolidation reduces size
// **Validates: Requirements 4.4**

import * as fc from 'fast-check';
import { consolidateMemory } from '../../lib/consolidate-memory';

/** Generate a random transient fact bullet point. */
const factArb = fc.tuple(
  fc.constantFrom(
    'likes', 'enjoys', 'prefers', 'mentioned', 'works', 'plays',
    'loves', 'dislikes', 'wants', 'needs', 'studies', 'watches',
  ),
  fc.constantFrom(
    'coding', 'hiking', 'music', 'cooking', 'reading', 'gaming',
    'running', 'painting', 'traveling', 'photography', 'gardening', 'swimming',
  ),
  fc.string({ minLength: 3, maxLength: 20 }),
).map(([verb, topic, extra]) => `- Owner ${verb} ${topic} ${extra.replace(/\n/g, ' ').trim()}`);

/** Generate a MEMORY.md with a given number of transient facts. */
function memoryMdArb(factCount: fc.Arbitrary<number>) {
  return factCount.chain((count) =>
    fc.array(factArb, { minLength: count, maxLength: count }).map((facts) => {
      return [
        '# Memory',
        '',
        '## Recent Observations',
        '- Something observed recently',
        '',
        '## Things Worth Remembering',
        ...facts,
        '',
      ].join('\n');
    })
  );
}

describe('Property 7: Memory consolidation reduces size', () => {
  it('should produce fewer entries than input when facts exceed 20', () => {
    fc.assert(
      fc.property(
        memoryMdArb(fc.integer({ min: 21, max: 50 })),
        (memoryMd) => {
          const result = consolidateMemory({ currentMemoryMd: memoryMd });

          expect(result.originalCount).toBeGreaterThan(20);
          expect(result.consolidatedCount).toBeLessThan(result.originalCount);
          expect(result.consolidatedCount).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return unchanged content when facts are 20 or fewer', () => {
    fc.assert(
      fc.property(
        memoryMdArb(fc.integer({ min: 0, max: 20 })),
        (memoryMd) => {
          const result = consolidateMemory({ currentMemoryMd: memoryMd });

          expect(result.updatedMemoryMd).toBe(memoryMd);
          expect(result.originalCount).toBe(result.consolidatedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve the Recent Observations section', () => {
    fc.assert(
      fc.property(
        memoryMdArb(fc.integer({ min: 21, max: 50 })),
        (memoryMd) => {
          const result = consolidateMemory({ currentMemoryMd: memoryMd });

          expect(result.updatedMemoryMd).toContain('## Recent Observations');
          expect(result.updatedMemoryMd).toContain('## Things Worth Remembering');
        }
      ),
      { numRuns: 100 }
    );
  });
});
