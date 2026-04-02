# Implementation Plan: Workspace Cleanup

## Overview

This plan addresses two issues: removing the duplicate `skills/` directory and strengthening the agent instructions in AGENTS.md and SKILL.md. All changes are file deletions, path updates, and content rewrites — no new runtime modules.

## Tasks

- [x] 1. Remove duplicate skill directory and update import paths
  - [x] 1.1 Delete the `skills/` directory at the project root
    - Remove `skills/identity-evolution/` and all contents (SKILL.md, scripts/, references/)
    - Verify `workspace/skills/identity-evolution/` still contains all files: SKILL.md, scripts/classify-stage.ts, scripts/update-user.ts, scripts/update-identity.ts, scripts/update-soul.ts, references/evolution-guide.md
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Update all test import paths from `skills/` to `workspace/skills/`
    - Update `tests/unit/update-user.test.ts`: change `../../skills/identity-evolution/scripts/update-user` to `../../workspace/skills/identity-evolution/scripts/update-user`
    - Update `tests/unit/classify-stage.test.ts`: change `../../skills/identity-evolution/scripts/classify-stage` to `../../workspace/skills/identity-evolution/scripts/classify-stage`
    - Update `tests/property/file-preservation.property.ts`: change import path
    - Update `tests/property/stage-classification.property.ts`: change import path
    - Update `tests/property/soul-preservation.property.ts`: change import path
    - Update `tests/property/fact-extraction.property.ts`: change import path
    - _Requirements: 1.3, 4.1, 6.3_

  - [ ]* 1.3 Write property test for canonical import paths
    - **Property 1: Test imports reference canonical skill location**
    - Scan all .ts files in tests/ for imports matching `skills/identity-evolution`
    - Assert every match is prefixed with `workspace/`
    - **Validates: Requirements 1.3, 4.1, 6.3**

- [x] 2. Checkpoint — Run existing test suite
  - Ensure all tests pass after import path changes, ask the user if questions arise.

- [x] 3. Strengthen AGENTS.md instructions
  - [x] 3.1 Add pre-response read checklist to AGENTS.md
    - Add a new section "## MANDATORY: Read Context Before Every Response" before the existing "## CRITICAL: Memory Updates" section
    - List each workspace file (SOUL.md, IDENTITY.md, USER.md, MEMORY.md) with a one-line description
    - Include explicit directive to read files before generating any reply
    - _Requirements: 2.1, 2.3_

  - [x] 3.2 Strengthen post-response write checklist in AGENTS.md
    - Restructure the existing "## CRITICAL: Memory Updates" section into a numbered post-response checklist
    - Add concrete `edit` tool usage examples for each update type: fact addition to USER.md, identity change to IDENTITY.md, personality evolution to SOUL.md, transient observation to MEMORY.md
    - Add mandatory minimum write rule: agent must use `edit` tool at least once per turn
    - _Requirements: 3.1, 3.3_

  - [ ]* 3.3 Write property test for AGENTS.md workspace file references
    - **Property 2: AGENTS.md references all workspace files**
    - For each file in {SOUL.md, IDENTITY.md, USER.md, MEMORY.md}, assert AGENTS.md contains the filename with a description
    - **Validates: Requirements 2.3**

  - [ ]* 3.4 Write property test for AGENTS.md edit tool examples
    - **Property 4: AGENTS.md contains edit tool examples for each update type**
    - For each update type in {fact addition, identity change, personality evolution, transient observation}, assert AGENTS.md contains a concrete edit tool example
    - **Validates: Requirements 3.3**

- [x] 4. Strengthen SKILL.md instructions
  - [x] 4.1 Add pre-response checklist to SKILL.md
    - Add a step-by-step pre-response checklist section at the top of the skill instructions
    - List the files to read and what to look for in each
    - _Requirements: 2.2_

  - [x] 4.2 Restructure post-response decision tree in SKILL.md
    - Restructure the existing "After EVERY Conversation Turn" section into a strict decision tree with explicit conditions
    - Add the mandatory minimum write rule: if no updates needed, write a timestamped "no new information" entry to MEMORY.md
    - _Requirements: 3.2, 3.4_

  - [ ]* 4.3 Write property test for SKILL.md decision tree coverage
    - **Property 3: SKILL.md contains decision tree for each managed file**
    - For each file in {USER.md, IDENTITY.md, SOUL.md, MEMORY.md}, assert SKILL.md contains a section naming that file with at least one write condition
    - **Validates: Requirements 3.2**

- [x] 5. Update README.md
  - [x] 5.1 Update project structure tree in README.md
    - Remove the `skills/` entry from the project structure tree
    - Add `workspace/skills/` with the identity-evolution skill listed under it
    - _Requirements: 1.4, 5.1_

  - [x] 5.2 Update README.md architecture description
    - Update the architecture section to mention that workspace files are read before every response and updated after every conversation turn
    - Ensure the Mermaid diagram or description reflects the read/write lifecycle
    - _Requirements: 5.2_

- [x] 6. Checkpoint — Run full test suite
  - Ensure all existing and new tests pass, ask the user if questions arise.

- [ ]* 7. Write unit tests for structural verification
  - Verify `skills/` directory does not exist at project root
  - Verify `workspace/skills/identity-evolution/` contains all expected files
  - Verify AGENTS.md contains pre-response read checklist section
  - Verify AGENTS.md contains post-response write checklist section
  - Verify SKILL.md contains mandatory minimum write rule
  - Verify README.md does not reference root-level `skills/` in the project structure tree
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.4, 5.1_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
