#!/bin/bash
set -e

echo "🦞 Discord Relationship Bot — Starting on Railway"

# Write OpenClaw config from environment variables
# Railway injects env vars at runtime, so we build the config here
mkdir -p /home/node/.openclaw

cat > /home/node/.openclaw/openclaw.json << JSONEOF
{
  "gateway": {
    "mode": "local",
    "port": ${PORT:-18789},
    "bind": "all"
  },
  "agents": {
    "defaults": {
      "workspace": "/app/workspace",
      "model": {
        "primary": "openrouter/qwen/qwen3-coder:free",
        "fallbacks": [
          "openrouter/nvidia/nemotron-3-super-120b-a12b:free",
          "openrouter/meta-llama/llama-3.3-70b-instruct:free"
        ]
      },
      "heartbeat": {
        "every": "30m"
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
        "${DISCORD_GUILD_ID}": {
          "requireMention": false,
          "channels": {
            "${DISCORD_CHANNEL_ID}": { "allow": true }
          }
        }
      }
    }
  }
}
JSONEOF

# Write env vars for OpenClaw to pick up
cat > /home/node/.openclaw/.env << ENVEOF
DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
ENVEOF

chmod 700 /home/node/.openclaw
chmod 600 /home/node/.openclaw/openclaw.json
chmod 600 /home/node/.openclaw/.env

echo "✓ Config written"
echo "✓ Workspace: /app/workspace"
echo "✓ Starting OpenClaw gateway..."

# Start the gateway
exec openclaw gateway
