# Requirements Document

## Introduction

The Discord Relationship Bot has two structural issues that undermine reliability:

1. The Identity Evolution Skill exists as identical copies in both `skills/` (project root) and `workspace/skills/` (OpenClaw runtime location). There is no build step or sync mechanism — just dead duplication. The canonical location is `workspace/skills/` where OpenClaw reads at runtime.

2. The workspace markdown files (SOUL.md, IDENTITY.md, USER.md, MEMORY.md, HEARTBEAT.md, AGENTS.md) serve as the bot's persistent brain, but the agent does not reliably read them before responding or update them after conversations. The current approach relies on instructional text in AGENTS.md and SKILL.md, which the LLM agent inconsistently follows.

This refactoring eliminates the duplication and strengthens the agent instructions so workspace files are reliably consulted and updated every turn.

## Glossary

- **Workspace_Files**: The set of markdown files in `workspace/` (SOUL.md, IDENTITY.md, USER.md, MEMORY.md, HEARTBEAT.md, AGENTS.md, TOOLS.md) that constitute the bot's persistent memory and personality.
- **Skill_Directory**: The `workspace/skills/identity-evolution/` directory where OpenClaw reads skill definitions at runtime.
- **Root_Skills_Directory**: The `skills/identity-evolution/` directory at the project root containing a duplicate copy of the skill files.
- **SKILL_Instructions**: The content of `workspace/skills/identity-evolution/SKILL.md` that directs the agent on how to update Workspace_Files after each conversation turn.
- **AGENTS_Instructions**: The content of `workspace/AGENTS.md` that defines the agent's operating rules, including the "CRITICAL: Memory Updates" section.
- **OpenClaw_Agent**: The OpenClaw-powered LLM agent that processes Discord messages and generates responses.
- **Startup_Module**: The `index.ts` entry point that initializes the bot and ensures workspace files exist.
- **Test_Suite**: The Jest + fast-check test infrastructure in `tests/unit/` and `tests/property/`.

## Requirements

### Requirement 1: Remove Duplicate Skill Directory

**User Story:** As a developer, I want a single source of truth for skill files, so that I do not maintain identical copies in two locations.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THE Root_Skills_Directory SHALL be deleted from the project.
2. THE Skill_Directory (`workspace/skills/identity-evolution/`) SHALL remain as the sole location for all skill files (SKILL.md, scripts/, references/).
3. WHEN a test file imports from the skill scripts, THE Test_Suite SHALL reference `workspace/skills/identity-evolution/scripts/` instead of `skills/identity-evolution/scripts/`.
4. WHEN the README.md documents the project structure, THE README.md SHALL reference `workspace/skills/` as the only skill location and SHALL NOT reference a root-level `skills/` directory.

### Requirement 2: Strengthen Agent Memory-Read Instructions

**User Story:** As a bot owner, I want the agent to always read its workspace files before responding, so that it has full context about our relationship and its own identity.

#### Acceptance Criteria

1. THE AGENTS_Instructions SHALL contain an explicit directive for the OpenClaw_Agent to read all Workspace_Files (SOUL.md, IDENTITY.md, USER.md, MEMORY.md) at the start of every conversation session.
2. THE SKILL_Instructions SHALL contain an explicit step-by-step pre-response checklist that the OpenClaw_Agent follows before generating any reply.
3. THE AGENTS_Instructions SHALL list each Workspace_File by name with a one-line description of what context it provides.

### Requirement 3: Strengthen Agent Memory-Write Instructions

**User Story:** As a bot owner, I want the agent to reliably persist what it learns after every conversation turn, so that it remembers facts about me and evolves over time.

#### Acceptance Criteria

1. THE AGENTS_Instructions SHALL contain a mandatory post-response checklist that the OpenClaw_Agent follows after every reply.
2. THE SKILL_Instructions SHALL contain a structured decision tree for each Workspace_File, specifying the exact conditions under which the OpenClaw_Agent writes to that file.
3. THE AGENTS_Instructions SHALL include concrete examples of correct edit tool usage for each type of update (fact addition, identity change, personality evolution, transient observation).
4. THE SKILL_Instructions SHALL specify that the OpenClaw_Agent MUST use the `edit` tool at least once per conversation turn, even if only to update MEMORY.md with a "no new information" observation.

### Requirement 4: Update Test Import Paths

**User Story:** As a developer, I want all tests to import from the canonical skill location, so that tests validate the actual runtime code.

#### Acceptance Criteria

1. WHEN a test file in the Test_Suite imports a skill script, THE import path SHALL resolve to `workspace/skills/identity-evolution/scripts/`.
2. WHEN the Test_Suite is executed after the refactoring, THE Test_Suite SHALL pass with zero import resolution errors.

### Requirement 5: Update Project Documentation

**User Story:** As a developer, I want the README and project documentation to accurately reflect the single-skill-directory structure, so that new contributors are not confused by stale references.

#### Acceptance Criteria

1. WHEN the README.md documents the project structure tree, THE README.md SHALL show `workspace/skills/` as the skill location and SHALL NOT show a root-level `skills/` directory.
2. THE README.md architecture description SHALL accurately describe the workspace file read/write lifecycle.

### Requirement 6: Preserve Existing Test Coverage

**User Story:** As a developer, I want all existing tests to continue passing after the refactoring, so that I have confidence the changes did not break anything.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THE Test_Suite SHALL pass all existing unit tests in `tests/unit/`.
2. WHEN the refactoring is complete, THE Test_Suite SHALL pass all existing property tests in `tests/property/`.
3. IF a test references the Root_Skills_Directory, THEN THE test SHALL be updated to reference the Skill_Directory instead.
