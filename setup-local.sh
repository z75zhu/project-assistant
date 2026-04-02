#!/bin/bash
# Sets up ~/.openclaw/openclaw.json for local development.
# Reads values from .env in this project directory.
set -e

if [ ! -f .env ]; then
  echo "No .env file found. Run: cp .env.example .env"
  exit 1
fi

set -a; source .env; set +a

MISSING=""
[ -z "$DISCORD_BOT_TOKEN" ] || [ "$DISCORD_BOT_TOKEN" = "your_discord_bot_token_here" ] && MISSING="$MISSING DISCORD_BOT_TOKEN"
[ -z "$OPENROUTER_API_KEY" ] || [ "$OPENROUTER_API_KEY" = "your_openrouter_api_key_here" ] && MISSING="$MISSING OPENROUTER_API_KEY"
[ -z "$DISCORD_GUILD_ID" ] || [ "$DISCORD_GUILD_ID" = "your_guild_id_here" ] && MISSING="$MISSING DISCORD_GUILD_ID"
[ -z "$DISCORD_CHANNEL_ID" ] || [ "$DISCORD_CHANNEL_ID" = "your_channel_id_here" ] && MISSING="$MISSING DISCORD_CHANNEL_ID"

if [ -n "$MISSING" ]; then
  echo "❌ Missing or placeholder values in .env:$MISSING"
  exit 1
fi

WORKSPACE_DIR="$(cd "$(dirname "$0")/workspace" && pwd)"

mkdir -p ~/.openclaw/agents/main/sessions

cat > ~/.openclaw/openclaw.json << JSONEOF
{
  "gateway": {
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "local-dev-token"
    }
  },
  "agents": {
    "defaults": {
      "workspace": "$WORKSPACE_DIR",
      "model": {
        "primary": "openrouter/nvidia/nemotron-3-super-120b-a12b:free",
        "fallbacks": [
          "openrouter/meta-llama/llama-3.3-70b-instruct:free",
          "openrouter/google/gemma-3-27b-it:free"
        ]
      },
      "heartbeat": {
        "every": "30m"
      },
      "compaction": {
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000,
          "prompt": "Write any facts you learned about the owner to USER.md, IDENTITY.md, SOUL.md, or MEMORY.md. Use the edit tool. Reply with NO_REPLY when done.",
          "systemPrompt": "Session nearing compaction. You MUST persist all learned facts to workspace files NOW using the edit tool."
        }
      }
    },
    "list": [
      { "id": "main", "default": true }
    ]
  },
  "models": {
    "mode": "merge",
    "providers": {
      "openrouter": {
        "apiKey": "\${OPENROUTER_API_KEY}",
        "baseUrl": "https://openrouter.ai/api/v1",
        "models": []
      }
    }
  },
  "channels": {
    "discord": {
      "enabled": true,
      "token": "\${DISCORD_BOT_TOKEN}",
      "dm": { "enabled": true },
      "groupPolicy": "allowlist",
      "guilds": {
        "$DISCORD_GUILD_ID": {
          "requireMention": false,
          "channels": {
            "$DISCORD_CHANNEL_ID": { "allow": true }
          }
        }
      }
    }
  }
}
JSONEOF

cat > ~/.openclaw/.env << ENVEOF
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
OPENROUTER_API_KEY=$OPENROUTER_API_KEY
ENVEOF

chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/openclaw.json
chmod 600 ~/.openclaw/.env

echo "✓ Config written to ~/.openclaw/openclaw.json"
echo "✓ Workspace: $WORKSPACE_DIR"
echo "✓ Run: npm start"
