// Feature: discord-relationship-bot, Property 6: Core personality trait preservation
// **Validates: Requirements 5.4**

import * as fc from "fast-check";
import { updateSoul } from "../../skills/identity-evolution/scripts/update-soul";

const CORE_TRAITS = ["Curious", "Friendly", "Open"];

const BASE_SOUL_MD = `# Soul

I am new. I don't know much about myself yet, and that's okay.

## Core Traits
- Curious: I genuinely want to learn about the person I'm talking to
- Friendly: I'm warm and approachable, never cold or robotic
- Open: I share my own thoughts and observations freely

## Communication Style
- Conversational and natural
- I match the energy of whoever I'm talking to
- I keep things light but genuine`;

/**
 * Generate a random trait name that is NOT one of the core traits.
 */
const traitNameArb = fc
  .stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz"), { minLength: 2, maxLength: 15 })
  .filter(
    (s) => !CORE_TRAITS.some((c) => c.toLowerCase() === s.toLowerCase())
  );

const traitArb = fc.record({
  trait: traitNameArb,
  description: fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz "), { minLength: 3, maxLength: 40 }),
});

/**
 * Optionally prepend some existing evolved traits to the SOUL.md
 * to simulate a SOUL.md that already has evolved traits.
 */
const existingEvolvedTraitsArb = fc.array(traitArb, { minLength: 0, maxLength: 5 });

function buildSoulMdWithEvolved(existingEvolved: { trait: string; description: string }[]): string {
  if (existingEvolved.length === 0) return BASE_SOUL_MD;

  const evolvedSection = existingEvolved
    .map((t) => `- ${t.trait}: ${t.description}`)
    .join("\n");

  return BASE_SOUL_MD.replace(
    "## Communication Style",
    `## Evolved Traits\n${evolvedSection}\n\n## Communication Style`
  );
}

describe("Property 6: Core personality trait preservation", () => {
  it("should always preserve core traits (Curious, Friendly, Open) after adding secondary traits", () => {
    fc.assert(
      fc.property(
        existingEvolvedTraitsArb,
        fc.array(traitArb, { minLength: 1, maxLength: 10 }),
        (existingEvolved, newTraits) => {
          const currentSoulMd = buildSoulMdWithEvolved(existingEvolved);
          const { updatedSoulMd } = updateSoul({ newTraits, currentSoulMd });

          for (const coreTrait of CORE_TRAITS) {
            const pattern = new RegExp(`-\\s+${coreTrait}:`, "i");
            expect(updatedSoulMd).toMatch(pattern);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should always preserve core traits even when new traits have empty arrays", () => {
    fc.assert(
      fc.property(existingEvolvedTraitsArb, (existingEvolved) => {
        const currentSoulMd = buildSoulMdWithEvolved(existingEvolved);
        const { updatedSoulMd } = updateSoul({ newTraits: [], currentSoulMd });

        for (const coreTrait of CORE_TRAITS) {
          const pattern = new RegExp(`-\\s+${coreTrait}:`, "i");
          expect(updatedSoulMd).toMatch(pattern);
        }
      }),
      { numRuns: 100 }
    );
  });
});
