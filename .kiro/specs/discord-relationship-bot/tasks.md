# Implementation Plan: Discord Relationship Bot

## Overview

Build an OpenClaw-based Discord bot that develops a relationship with its owner from scratch. The implementation uses OpenClaw's workspace file system for persistent identity, a custom Identity Evolution Skill for dynamic file updates, and the heartbeat mechanism for proactive outreach. All scripts are TypeScript (Node.js), tested with Jest (ts-jest) and fast-check.

## Tasks

- [ ] 1. Initialize project structure and dependencies
  - [ ] 1.1 Create package.json with dependencies (openclaw, fast-check, jest) and scripts (start, test)
    - Include `openclaw` as the main dependency
    - Include `typescript`, `tsx`, `ts-jest`, `@types/jest`, `jest`, and `fast-check` as dev dependencies
    - Add `start` script to launch OpenClaw gateway
    - Add `test` script to run Jest with ts-jest
    - _Requirements: 8.1, 9.1_

  - [ ] 1.2 Create .env.example with all required environment variables
    - DISCORD_BOT_TOKEN, OPENAI_API_KEY, DISCORD_GUILD_ID, DISCORD_CHANNEL_ID
    - Include descriptions as comments for each variable
    - _Requirements: 9.4_

  - [ ] 1.3 Create .gitignore for node_modules, .env, logs/, dist/
    - _Requirements: 9.1_

  - [ ] 1.4 Create tsconfig.json and the OpenClaw configuration file (.openclaw.config.json)
    - tsconfig.json with strict mode, ES2022 target, Node module resolution
    - Configure Discord channel with guild and channel ID from env vars
    - Configure OpenAI provider with gpt-4o-mini model
    - Enable heartbeat with 30-minute interval
    - _Requirements: 8.1, 8.4, 8.5_

- [ ] 2. Create initial workspace files
  - [ ] 2.1 Create workspace/AGENTS.md with operating rules
    - Owner identification (cm6550)
    - Conversation rules (one question max, reciprocity, no citations)
    - Identity rules (acknowledge no name, propose naturally)
    - Safety rules
    - _Requirements: 8.2, 1.5, 1.6, 4.1, 7.4_

  - [ ] 2.2 Create workspace/SOUL.md with minimal base personality
    - Core traits: curious, friendly, open
    - Communication style: conversational, match energy, light but genuine
    - _Requirements: 5.1, 8.3_

  - [ ] 2.3 Create workspace/IDENTITY.md with empty initial state
    - Name: not yet chosen
    - Avatar: not yet generated
    - About: brand new, no history
    - _Requirements: 1.1, 2.1, 8.3_

  - [ ] 2.4 Create workspace/USER.md with initial owner profile structure
    - Discord username: cm6550
    - Empty sections for interests, important things, communication preferences
    - Relationship section: stage=early, sessions=0, stableFacts=0
    - Include outreach tracking fields: lastOutreachAt, lastOutreachResponded, consecutiveIgnoredOutreaches
    - _Requirements: 2.1, 6.1, 8.3_

  - [ ] 2.5 Create workspace/MEMORY.md with empty structure
    - Sections for recent observations and things worth remembering
    - _Requirements: 8.3_

  - [ ] 2.6 Create workspace/HEARTBEAT.md with proactive outreach logic
    - Stage-based timing rules (early: 4hr, developing: 8hr, established: 24hr)
    - Backoff rules (12hr after 1 ignore, 48hr after 2 consecutive ignores)
    - Motivation check (must have specific reason from USER.md/MEMORY.md)
    - Message composition rules (brief, natural, one question max)
    - Logging instruction for outreach attempts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 2.7 Write unit tests for workspace file initialization
    - Verify each file exists and contains expected default content
    - Verify SOUL.md contains exactly three core traits
    - Verify USER.md relationship section has stage=early
    - _Requirements: 5.1, 6.1, 8.3_

- [ ] 3. Implement core skill scripts
  - [ ] 3.1 Implement scripts/classify-stage.ts
    - Input: { sessionCount, stableFactCount, soulComplete }
    - Return "early" when sessions < 10
    - Return "developing" when sessions 10-30 AND stableFacts >= 10
    - Return "established" when sessions > 30 AND soulComplete
    - Return { stage, changed } where changed compares to previous stage
    - Handle edge cases: sessions 10-30 but facts < 10 stays "early"; sessions > 30 but not soulComplete stays "developing"
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 3.2 Write property test for stage classification (Property 5)
    - **Property 5: Relationship stage classification**
    - Generate random sessionCount (0-100), stableFactCount (0-50), soulComplete (boolean)
    - Verify output is always one of "early", "developing", "established"
    - Verify classification rules match requirements
    - Minimum 100 iterations
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ] 3.3 Implement scripts/update-user.ts
    - Input: { facts: [{ key, value, category, priority }], currentUserMd, mode }
    - mode "append": add new facts to appropriate sections, preserve all existing content
    - mode "correct": find and replace existing fact, log correction
    - Parse USER.md markdown structure, insert facts into correct category section
    - Update stableFactsLearned count in relationship section
    - Return { updatedUserMd, factsAdded }
    - _Requirements: 1.2, 2.2, 2.5, 2.6, 4.5_

  - [ ] 3.4 Write property test for fact extraction persistence (Property 1)
    - **Property 1: Fact extraction persists to USER.md**
    - Generate random existing USER.md content and random new facts
    - Verify output contains all original facts plus new facts
    - Minimum 100 iterations
    - **Validates: Requirements 1.2, 2.2**

  - [ ] 3.5 Write property test for file update preservation (Property 2)
    - **Property 2: File update preservation invariant**
    - Generate random USER.md content and random update operations
    - Verify all original content is preserved in output (unless mode is "correct")
    - Minimum 100 iterations
    - **Validates: Requirements 2.5**

  - [ ] 3.6 Implement scripts/update-soul.ts
    - Input: { newTraits: [{ trait, description }], currentSoulMd }
    - Parse existing SOUL.md, identify core traits section
    - Add new traits to a secondary traits section
    - Never remove or modify core traits (curious, friendly, open)
    - Return { updatedSoulMd, traitsModified }
    - _Requirements: 2.3, 5.4_

  - [ ] 3.7 Write property test for core trait preservation (Property 6)
    - **Property 6: Core personality trait preservation**
    - Generate random existing SOUL.md with core traits and random new secondary traits
    - Verify output always contains "curious", "friendly", "open"
    - Minimum 100 iterations
    - **Validates: Requirements 5.4**

  - [ ] 3.8 Implement scripts/update-identity.ts
    - Input: { field: "name" | "avatar" | "about", value, currentIdentityMd }
    - Parse IDENTITY.md markdown, update the specified field
    - Preserve all other fields unchanged
    - Return { updatedIdentityMd }
    - _Requirements: 1.3, 1.7, 2.1_

- [ ] 4. Checkpoint — Verify core scripts
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement outreach decision logic
  - [ ] 5.1 Implement a decide-outreach.ts utility function
    - Input: { relationshipState (from USER.md), currentTime, ownerContext (from USER.md + MEMORY.md) }
    - Enforce stage-based minimum intervals (early: 4hr, developing: 8hr, established: 24hr)
    - Enforce backoff: 12hr after 1 ignored outreach, 48hr after 2+ consecutive ignores
    - Check if ownerContext has meaningful content for motivation; if not, skip
    - Return OutreachDecision { shouldReachOut, reason, skipReason, nextEligibleAt }
    - _Requirements: 3.2, 3.3, 3.5, 3.6, 3.7_

  - [ ] 5.2 Write property test for stage-based outreach timing (Property 3)
    - **Property 3: Stage-based outreach timing**
    - Generate random relationship states and timestamps
    - Verify correct minimum interval enforcement per stage
    - Minimum 100 iterations
    - **Validates: Requirements 3.2, 3.3**

  - [ ] 5.3 Write property test for outreach backoff (Property 4)
    - **Property 4: Outreach backoff on ignored messages**
    - Generate random states with varying consecutiveIgnoredOutreaches and timestamps
    - Verify 12hr cooldown after 1 ignore, 48hr after 2+ ignores
    - Minimum 100 iterations
    - **Validates: Requirements 3.5, 3.6**

- [ ] 6. Implement memory consolidation and access control
  - [ ] 6.1 Implement a consolidate-memory.ts utility function
    - Input: { currentMemoryMd }
    - Count transient facts; if <= 20, return unchanged
    - Group related facts by topic
    - Summarize each group into a concise entry
    - Return { updatedMemoryMd, originalCount, consolidatedCount }
    - _Requirements: 4.4_

  - [ ] 6.2 Write property test for memory consolidation (Property 7)
    - **Property 7: Memory consolidation reduces size**
    - Generate MEMORY.md with 21-50 random transient facts
    - Verify output has fewer entries than input
    - Minimum 100 iterations
    - **Validates: Requirements 4.4**

  - [ ] 6.3 Implement a check-owner.ts utility function
    - Input: { senderDiscordId }
    - Return { isOwner: boolean } — true only for "cm6550"
    - _Requirements: 7.4_

  - [ ] 6.4 Write property test for owner-only access control (Property 8)
    - **Property 8: Owner-only access control**
    - Generate random Discord user ID strings
    - Verify only "cm6550" returns isOwner=true, all others return false
    - Minimum 100 iterations
    - **Validates: Requirements 7.4**

- [ ] 7. Checkpoint — Verify all utility functions and properties
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Create the Identity Evolution Skill
  - [ ] 8.1 Create skills/identity-evolution/SKILL.md with frontmatter and instructions
    - name: identity-evolution
    - description: evolves bot identity, personality, and owner knowledge
    - user-invocable: false
    - Skill body: instructions for when to invoke each script
    - After each turn: evaluate for new owner facts → update-user.ts
    - Every 5 exchanges (early) or 20 exchanges (established): evaluate personality → update-soul.ts
    - When 3+ interests learned and no name yet: propose name → update-identity.ts (after confirmation)
    - After name + 3 interests: generate avatar description → update-identity.ts
    - After each session: re-evaluate stage → classify-stage.ts
    - _Requirements: 1.2, 1.3, 1.4, 1.7, 2.2, 2.3, 2.6, 4.3, 4.5, 5.2, 5.3, 5.4, 6.1, 6.5_

  - [ ] 8.2 Create skills/identity-evolution/references/evolution-guide.md
    - Detailed rules for stable vs transient fact classification
    - Examples of personality trait evolution
    - Name proposal guidelines (based on relationship character)
    - Avatar description guidelines
    - Stage transition criteria with examples
    - _Requirements: 4.3, 5.2, 5.3_

- [ ] 9. Implement error handling wrappers
  - [ ] 9.1 Create a lib/error-handler.ts module
    - withRetry(fn, { maxRetries, delayMs }) — generic retry wrapper
    - readFileWithFallback(filePath, defaultContent) — reads file or returns default
    - writeFileWithRetry(filePath, content) — writes with one retry, logs on failure
    - Global error handler setup for unhandled exceptions → logs to logs/errors.log
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ] 9.2 Write unit tests for error handling
    - Test retry logic: mock function that fails once then succeeds
    - Test readFileWithFallback: mock missing file returns default
    - Test writeFileWithRetry: mock write failure logs error
    - Test global error handler: mock unhandled error gets logged
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 10. Wire everything together and create README
  - [ ] 10.1 Create the main entry point / startup script
    - Load environment variables
    - Verify all workspace files exist (create defaults if missing using readFileWithFallback)
    - Start OpenClaw gateway with Discord channel configuration
    - Log startup status
    - _Requirements: 2.4, 7.2, 8.1, 8.4, 8.5_

  - [ ] 10.2 Write README.md
    - Architecture overview with diagram reference
    - How the bot works (workspace files, identity evolution, proactive outreach)
    - Setup instructions: Discord bot creation, env vars, npm install, npm start
    - Design decisions summary (why OpenClaw, file-based memory, skill architecture)
    - Deployment instructions (Railway.app)
    - _Requirements: 8.6, 9.2, 9.6_

- [ ] 11. Final checkpoint — Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Post-conversation: commit bot state files
  - After running the bot and having at least one conversation session, commit the updated workspace files (IDENTITY.md, USER.md, SOUL.md, MEMORY.md) to the repository
  - This demonstrates to the evaluator what the bot learned about itself and the owner
  - _Requirements: 9.3_

## Notes

- All tasks are required (comprehensive testing from start)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The Identity Evolution Skill (task 8) wires together all the scripts from tasks 3, 5, and 6
