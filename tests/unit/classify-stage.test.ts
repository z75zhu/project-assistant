import { classifyStage } from "../../skills/identity-evolution/scripts/classify-stage";

describe("classifyStage", () => {
  // --- "early" stage ---

  it('returns "early" when sessionCount < 10', () => {
    const result = classifyStage({ sessionCount: 0, stableFactCount: 0, soulComplete: false });
    expect(result.stage).toBe("early");
  });

  it('returns "early" at sessionCount 9 regardless of other factors', () => {
    const result = classifyStage({ sessionCount: 9, stableFactCount: 50, soulComplete: true });
    expect(result.stage).toBe("early");
  });

  it('returns "early" when sessions 10-30 but stableFacts < 10', () => {
    const result = classifyStage({ sessionCount: 15, stableFactCount: 5, soulComplete: true });
    expect(result.stage).toBe("early");
  });

  // --- "developing" stage ---

  it('returns "developing" when sessions 10-30 and stableFacts >= 10', () => {
    const result = classifyStage({ sessionCount: 20, stableFactCount: 10, soulComplete: false });
    expect(result.stage).toBe("developing");
  });

  it('returns "developing" at boundary sessionCount=10 with stableFacts=10', () => {
    const result = classifyStage({ sessionCount: 10, stableFactCount: 10, soulComplete: false });
    expect(result.stage).toBe("developing");
  });

  it('returns "developing" at boundary sessionCount=30 with stableFacts=10', () => {
    const result = classifyStage({ sessionCount: 30, stableFactCount: 10, soulComplete: false });
    expect(result.stage).toBe("developing");
  });

  it('returns "developing" when sessions > 30 but soulComplete is false', () => {
    const result = classifyStage({ sessionCount: 50, stableFactCount: 30, soulComplete: false });
    expect(result.stage).toBe("developing");
  });

  // --- "established" stage ---

  it('returns "established" when sessions > 30 and soulComplete', () => {
    const result = classifyStage({ sessionCount: 31, stableFactCount: 20, soulComplete: true });
    expect(result.stage).toBe("established");
  });

  // --- changed flag ---

  it("returns changed=false when no previousStage is provided", () => {
    const result = classifyStage({ sessionCount: 5, stableFactCount: 0, soulComplete: false });
    expect(result.changed).toBe(false);
  });

  it("returns changed=false when stage matches previousStage", () => {
    const result = classifyStage(
      { sessionCount: 5, stableFactCount: 0, soulComplete: false },
      "early"
    );
    expect(result.changed).toBe(false);
  });

  it("returns changed=true when stage differs from previousStage", () => {
    const result = classifyStage(
      { sessionCount: 20, stableFactCount: 15, soulComplete: false },
      "early"
    );
    expect(result.stage).toBe("developing");
    expect(result.changed).toBe(true);
  });

  it("returns changed=true when transitioning from developing to established", () => {
    const result = classifyStage(
      { sessionCount: 35, stableFactCount: 20, soulComplete: true },
      "developing"
    );
    expect(result.stage).toBe("established");
    expect(result.changed).toBe(true);
  });
});
