# Implementation Plan: OpenAI Migration

## Overview

Migrate the LLM provider configuration from OpenRouter to OpenAI across all config generation scripts, environment templates, entry point validation, and documentation. Extract config generation logic into a testable function for property-based testing.

## Tasks

- [x] 1. Update environment template and entry point
  - [x] 1.1 Update `.env.example` to replace `OPENROUTER_API_KEY` with `OPENAI_API_KEY` and update the comment to reference OpenAI
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Verify `index.ts` `checkEnvVars()` references `OPENAI_API_KEY` and contains no `OPENROUTER` references
    - _Requirements: 4.1, 4.2_

- [x] 2. Update startup script for Railway/VPS deployment
  - [x] 2.1 Update `start.sh` debug output, env var validation, provider block, model references, runtime `.env` writing, and echo messages to use OpenAI instead of OpenRouter
    - Replace `OPENROUTER_API_KEY` with `OPENAI_API_KEY` in debug output, validation, and `.env` heredoc
    - Replace `openrouter` provider block with `openai` provider (`apiKey: ${OPENAI_API_KEY}`, `baseUrl: https://api.openai.com/v1`)
    - Replace primary model with `openai/gpt-5.4-nano` and remove fallbacks array
    - Update echo confirmation message for the model name
    - _Requirements: 1.3, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 3. Update setup script for local development
  - [x] 3.1 Update `setup-local.sh` env var validation, provider block, model references, runtime `.env` writing to use OpenAI instead of OpenRouter
    - Replace `OPENROUTER_API_KEY` with `OPENAI_API_KEY` in validation (including placeholder check against `your_openai_api_key_here`)
    - Replace `openrouter` provider block with `openai` provider (same as start.sh)
    - Replace primary model with `openai/gpt-5.4-nano` and remove fallbacks array
    - Replace `OPENROUTER_API_KEY` with `OPENAI_API_KEY` in `.env` heredoc
    - _Requirements: 1.4, 1.6, 2.4, 2.5, 2.6, 3.3, 3.4_

- [x] 4. Update documentation
  - [x] 4.1 Update `README.md` to replace all OpenRouter references with OpenAI
    - Update prerequisites section (OpenAI API key link instead of openrouter.ai/keys)
    - Update architecture diagram label from `OpenRouter API` to `OpenAI API` and model names
    - Update local setup `.env` example block
    - Update Railway deployment environment variables table
    - Replace all remaining `OPENROUTER_API_KEY` references with `OPENAI_API_KEY`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5. Checkpoint — Verify all file changes are consistent
  - Ensure all tests pass, ask the user if questions arise.
  - Grep the entire project for any remaining `OPENROUTER` references to confirm complete migration

- [ ] 6. Extract config generation logic and write tests
  - [x] 6.1 Create `lib/generate-config.ts` — a testable function that takes env var values as input and returns the OpenClaw JSON config string
    - Function signature: `generateOpenClawConfig(vars: { discordBotToken: string, openaiApiKey: string, discordGuildId: string, discordChannelId: string, port?: number, gatewayToken?: string, workspaceDir?: string }) => string`
    - The function should produce the same JSON structure as the heredocs in `start.sh` and `setup-local.sh`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 6.2 Write property tests in `tests/property/config-generation.property.ts`
    - **Property 1: Generated config is valid JSON**
    - **Validates: Requirements 6.1, 6.2**
    - **Property 2: Provider key is openai**
    - **Validates: Requirements 2.1, 2.4**
    - **Property 3: Provider base URL is OpenAI endpoint**
    - **Validates: Requirements 2.2, 2.5**
    - **Property 4: Model config uses gpt-5.4-nano with no fallbacks**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - **Property 5: Provider entry has complete structure**
    - **Validates: Requirements 6.3, 6.4**
  - [ ]* 6.3 Write unit tests in `tests/unit/openai-migration.test.ts`
    - Verify `.env.example` contains `OPENAI_API_KEY` and not `OPENROUTER_API_KEY`
    - Verify `start.sh` references `OPENAI_API_KEY` in validation block
    - Verify `setup-local.sh` references `OPENAI_API_KEY` in validation block
    - Verify `README.md` contains `OPENAI_API_KEY` and not `OPENROUTER_API_KEY`
    - Verify no project files contain `OPENROUTER` references
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The config generation function (task 6.1) mirrors the shell script heredoc logic in TypeScript for testability
- Property tests validate universal correctness properties across random env var inputs
- Unit tests validate specific file content as static examples
