import { updateUser, OwnerFact } from "../../skills/identity-evolution/scripts/update-user";

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

describe("updateUser — append mode", () => {
  it("adds a basic_info fact and removes placeholder", () => {
    const result = updateUser({
      facts: [{ key: "real_name", value: "Alice", category: "basic_info", priority: "normal" }],
      currentUserMd: DEFAULT_USER_MD,
      mode: "append",
    });

    expect(result.updatedUserMd).toContain("- real_name: Alice");
    expect(result.updatedUserMd).toContain("- Discord username: cm6550");
    expect(result.updatedUserMd).not.toContain("Everything else: still learning!");
    expect(result.factsAdded).toBe(1);
  });

  it("adds an interest and removes placeholder text", () => {
    const result = updateUser({
      facts: [{ key: "hobby", value: "rock climbing", category: "interests", priority: "normal" }],
      currentUserMd: DEFAULT_USER_MD,
      mode: "append",
    });

    expect(result.updatedUserMd).toContain("- hobby: rock climbing");
    expect(result.updatedUserMd).not.toContain("(None discovered yet)");
    expect(result.factsAdded).toBe(1);
  });

  it("formats high-priority facts with a star", () => {
    const result = updateUser({
      facts: [{ key: "milestone", value: "got promoted", category: "important_events", priority: "high" }],
      currentUserMd: DEFAULT_USER_MD,
      mode: "append",
    });

    expect(result.updatedUserMd).toContain("- ⭐ milestone: got promoted");
    expect(result.updatedUserMd).not.toContain("(Nothing yet — we just met!)");
  });

  it("increments stable facts learned count", () => {
    const result = updateUser({
      facts: [
        { key: "hobby", value: "chess", category: "interests", priority: "normal" },
        { key: "job", value: "engineer", category: "basic_info", priority: "normal" },
      ],
      currentUserMd: DEFAULT_USER_MD,
      mode: "append",
    });

    expect(result.updatedUserMd).toContain("Stable facts learned: 2");
    expect(result.factsAdded).toBe(2);
  });

  it("preserves all existing content when appending", () => {
    const result = updateUser({
      facts: [{ key: "hobby", value: "chess", category: "interests", priority: "normal" }],
      currentUserMd: DEFAULT_USER_MD,
      mode: "append",
    });

    expect(result.updatedUserMd).toContain("# About My Owner");
    expect(result.updatedUserMd).toContain("## Basic Info");
    expect(result.updatedUserMd).toContain("- Discord username: cm6550");
    expect(result.updatedUserMd).toContain("## Relationship");
    expect(result.updatedUserMd).toContain("- Stage: early");
  });

  it("adds multiple facts to the same category", () => {
    const result = updateUser({
      facts: [
        { key: "hobby1", value: "chess", category: "interests", priority: "normal" },
        { key: "hobby2", value: "hiking", category: "interests", priority: "normal" },
      ],
      currentUserMd: DEFAULT_USER_MD,
      mode: "append",
    });

    expect(result.updatedUserMd).toContain("- hobby1: chess");
    expect(result.updatedUserMd).toContain("- hobby2: hiking");
    expect(result.factsAdded).toBe(2);
  });

  it("adds facts to a section that already has content", () => {
    const withExisting = DEFAULT_USER_MD.replace(
      "(None discovered yet)",
      "- hobby: chess"
    );
    const result = updateUser({
      facts: [{ key: "hobby2", value: "hiking", category: "interests", priority: "normal" }],
      currentUserMd: withExisting,
      mode: "append",
    });

    expect(result.updatedUserMd).toContain("- hobby: chess");
    expect(result.updatedUserMd).toContain("- hobby2: hiking");
  });
});

describe("updateUser — correct mode", () => {
  const populatedMd = DEFAULT_USER_MD.replace(
    "- Everything else: still learning!",
    "- job: software engineer"
  );

  it("replaces an existing fact value", () => {
    const result = updateUser({
      facts: [{ key: "job", value: "designer", category: "basic_info", priority: "normal" }],
      currentUserMd: populatedMd,
      mode: "correct",
    });

    expect(result.updatedUserMd).toContain("- job: designer");
    expect(result.updatedUserMd).not.toContain("software engineer");
    expect(result.factsAdded).toBe(1);
  });

  it("returns a correction log", () => {
    const result = updateUser({
      facts: [{ key: "job", value: "designer", category: "basic_info", priority: "normal" }],
      currentUserMd: populatedMd,
      mode: "correct",
    });

    expect(result.correctionLog).toBeDefined();
    expect(result.correctionLog).toContain("**Field**: job");
    expect(result.correctionLog).toContain("**Old value**: software engineer");
    expect(result.correctionLog).toContain("**New value**: designer");
    expect(result.correctionLog).toContain("**Timestamp**:");
  });

  it("does nothing when the key is not found", () => {
    const result = updateUser({
      facts: [{ key: "nonexistent", value: "value", category: "basic_info", priority: "normal" }],
      currentUserMd: populatedMd,
      mode: "correct",
    });

    expect(result.updatedUserMd).toBe(populatedMd);
    expect(result.factsAdded).toBe(0);
    expect(result.correctionLog).toBeUndefined();
  });

  it("can correct a high-priority fact", () => {
    const withStar = DEFAULT_USER_MD.replace(
      "(Nothing yet — we just met!)",
      "- ⭐ milestone: got promoted"
    );
    const result = updateUser({
      facts: [{ key: "milestone", value: "started new company", category: "important_events", priority: "high" }],
      currentUserMd: withStar,
      mode: "correct",
    });

    expect(result.updatedUserMd).toContain("- ⭐ milestone: started new company");
    expect(result.updatedUserMd).not.toContain("got promoted");
  });
});
