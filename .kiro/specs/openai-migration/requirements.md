# Requirements Document

## Introduction

This feature migrates the Discord Relationship Bot's LLM invocation layer from OpenRouter to OpenAI's ChatGPT API. The bot is built on the OpenClaw framework, which handles actual HTTP calls to the LLM provider — the migration involves updating configuration generation (shell scripts), environment variable references, model identifiers, and documentation. The target model is `gpt-5.4-nano`.

The bot operates in two environments:
- **Railway/VPS deployment** — uses `start.sh` to generate config at runtime from injected environment variables
- **Local development** — uses `setup-local.sh` to generate config from a `.env` file

Both environments must be updated consistently.

## Glossary

- **OpenClaw_Config**: The JSON configuration file at `~/.openclaw/openclaw.json` that defines the LLM provider, model, gateway settings, and channel configuration for the OpenClaw framework.
- **Provider_Block**: The `models.providers` section within the OpenClaw_Config that specifies the LLM provider name, API key, and base URL.
- **Startup_Script**: The `start.sh` shell script used for Railway deployment that generates the OpenClaw_Config from environment variables at runtime.
- **Setup_Script**: The `setup-local.sh` shell script used for local development that generates the OpenClaw_Config from `.env` file values.
- **Env_Template**: The `.env.example` file that documents required environment variables with placeholder values.
- **Entry_Point**: The `index.ts` file that verifies workspace files and checks environment variables on startup.

## Requirements

### Requirement 1: Replace OpenRouter Environment Variable with OpenAI

**User Story:** As a bot operator, I want the environment configuration to reference `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY` in both local and deployment environments, so that I can provide my OpenAI credentials to authenticate with the OpenAI API.

#### Acceptance Criteria

1. THE Env_Template SHALL define `OPENAI_API_KEY` as a required variable with a descriptive comment referencing OpenAI.
2. THE Env_Template SHALL NOT contain any reference to `OPENROUTER_API_KEY`.
3. WHEN the Startup_Script validates environment variables, THE Startup_Script SHALL check for `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY`.
4. WHEN the Setup_Script validates environment variables, THE Setup_Script SHALL check for `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY`.
5. WHEN the Startup_Script writes the OpenClaw runtime `.env` file, THE Startup_Script SHALL include `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY`.
6. WHEN the Setup_Script writes the OpenClaw runtime `.env` file, THE Setup_Script SHALL include `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY`.

### Requirement 2: Update Provider Configuration to OpenAI

**User Story:** As a bot operator, I want the OpenClaw configuration to use the OpenAI provider with the correct base URL, so that LLM requests are routed to OpenAI's API.

#### Acceptance Criteria

1. WHEN the Startup_Script generates the OpenClaw_Config, THE Provider_Block SHALL use `openai` as the provider key instead of `openrouter`.
2. WHEN the Startup_Script generates the OpenClaw_Config, THE Provider_Block SHALL set the base URL to `https://api.openai.com/v1`.
3. WHEN the Startup_Script generates the OpenClaw_Config, THE Provider_Block SHALL reference `${OPENAI_API_KEY}` as the API key.
4. WHEN the Setup_Script generates the OpenClaw_Config, THE Provider_Block SHALL use `openai` as the provider key instead of `openrouter`.
5. WHEN the Setup_Script generates the OpenClaw_Config, THE Provider_Block SHALL set the base URL to `https://api.openai.com/v1`.
6. WHEN the Setup_Script generates the OpenClaw_Config, THE Provider_Block SHALL reference `${OPENAI_API_KEY}` as the API key.

### Requirement 3: Update Model References to GPT-5.4 Nano

**User Story:** As a bot operator, I want the bot to use the `gpt-5.4-nano` model, so that LLM calls use the intended OpenAI model.

#### Acceptance Criteria

1. WHEN the Startup_Script generates the OpenClaw_Config, THE Startup_Script SHALL set the primary model to `openai/gpt-5.4-nano`.
2. WHEN the Startup_Script generates the OpenClaw_Config, THE Startup_Script SHALL NOT include any fallback models.
3. WHEN the Setup_Script generates the OpenClaw_Config, THE Setup_Script SHALL set the primary model to `openai/gpt-5.4-nano`.
4. WHEN the Setup_Script generates the OpenClaw_Config, THE Setup_Script SHALL NOT include any fallback models.

### Requirement 4: Maintain Entry Point Consistency

**User Story:** As a developer, I want the `index.ts` entry point to check for `OPENAI_API_KEY`, so that local startup validation is consistent with the rest of the configuration.

#### Acceptance Criteria

1. WHEN the Entry_Point checks environment variables, THE Entry_Point SHALL verify that `OPENAI_API_KEY` is present.
2. THE Entry_Point SHALL NOT reference `OPENROUTER_API_KEY` in any validation or logic.

### Requirement 5: Update Documentation

**User Story:** As a developer or contributor, I want the README and related documentation to reference OpenAI instead of OpenRouter, so that setup instructions are accurate for both local and deployment environments.

#### Acceptance Criteria

1. THE README SHALL reference `OPENAI_API_KEY` in all environment variable instructions and tables.
2. THE README SHALL NOT contain references to `OPENROUTER_API_KEY` or `openrouter.ai`.
3. THE README architecture diagram SHALL reference OpenAI API instead of OpenRouter API.
4. THE README prerequisites section SHALL instruct users to obtain an OpenAI API key instead of an OpenRouter API key.
5. THE README deployment section SHALL list `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY` in the Railway environment variables table.
6. THE README local setup section SHALL show `OPENAI_API_KEY` in the `.env` example block.

### Requirement 6: Validate Generated Configuration Structure

**User Story:** As a developer, I want confidence that the generated OpenClaw configuration is structurally valid after migration, so that the bot starts correctly with the new provider.

#### Acceptance Criteria

1. WHEN the Startup_Script generates the OpenClaw_Config, THE OpenClaw_Config SHALL be valid JSON.
2. WHEN the Setup_Script generates the OpenClaw_Config, THE OpenClaw_Config SHALL be valid JSON.
3. THE OpenClaw_Config SHALL contain exactly one provider entry under `models.providers`.
4. THE OpenClaw_Config provider entry SHALL contain `apiKey`, `baseUrl`, and `models` fields.
