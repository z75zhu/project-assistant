/**
 * Relationship stage classification logic.
 *
 * Determines the current relationship stage based on session count,
 * stable fact count, and personality completeness.
 *
 * Classification rules:
 *   1. sessions < 10                              → "early"
 *   2. 10 <= sessions <= 30 AND stableFacts >= 10  → "developing"
 *   3. 10 <= sessions <= 30 AND stableFacts < 10   → "early"
 *   4. sessions > 30 AND soulComplete              → "established"
 *   5. sessions > 30 AND !soulComplete             → "developing"
 */

export interface ClassifyStageInput {
  sessionCount: number;
  stableFactCount: number;
  soulComplete: boolean;
}

export type RelationshipStage = "early" | "developing" | "established";

export interface ClassifyStageOutput {
  stage: RelationshipStage;
  changed: boolean;
}

export function classifyStage(
  input: ClassifyStageInput,
  previousStage?: RelationshipStage
): ClassifyStageOutput {
  const { sessionCount, stableFactCount, soulComplete } = input;

  let stage: RelationshipStage;

  if (sessionCount < 10) {
    stage = "early";
  } else if (sessionCount <= 30) {
    stage = stableFactCount >= 10 ? "developing" : "early";
  } else {
    // sessionCount > 30
    stage = soulComplete ? "established" : "developing";
  }

  const changed = previousStage !== undefined && previousStage !== stage;

  return { stage, changed };
}
