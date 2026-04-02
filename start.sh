#!/bin/bash
set -e

echo "🦞 Discord Relationship Bot — Starting on Railway"

# Validate required env vars
MISSING=""
[ -z "$DISCORD_BOT_TOKEN" ] && MISSING="$MISSING DISCORD_BOT_TOKEN"
[ -z "$OPENROUTER_API_KEY" ] && MISSING="$MISSING OPENROUTER_API_KEY"
[ -z "$DISCORD_GUILD_ID" ] && MISSING="$MISSING DISCORD_GUILD_ID"
[ -z "$DISCORD_CHANNEL_ID" ] && MISSING="$MISSING DISCORD_CHANNEL_ID"

if [ -n "$MISSING" ]; then
  echo "❌ Missing required environment variables:$MISSING"
  exit 1
fi

# Generate a gateway token if not provided
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-railway-$(cat /proc/sys/kernel/random/uuid 2>/dev/null || node -e 'process.stdout.write(require("crypto").randomUUID())')}"

# Determine home dir (works as root or non-root)
OPENCLAW_HOME="${HOME}/.openclaw"
mkdir -p "$OPENCLAW_HOME/agents/main/sessions"

# Write OpenClaw config from environment variables
cat > "$OPENCLAW_HOME/openclaw.json" << JSONEOF
{
  "gateway": {
    "mode": "local",
    "port": ${PORT:-18789},
    "bind": "all",
    "auth": {
      "mode": "token",
      "token": "$GATEWAY_TOKEN"
    }
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

# Write env vars for OpenClaw to resolve at runtime
cat > "$OPENCLAW_HOME/.env" << ENVEOF
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
OPENROUTER_API_KEY=$OPENROUTER_API_KEY
ENVEOF

chmod 700 "$OPENCLAW_HOME"
chmod 600 "$OPENCLAW_HOME/openclaw.json"
chmod 600 "$OPENCLAW_HOME/.env"

echo "✓ Config written to $OPENCLAW_HOME/openclaw.json"
echo "✓ Workspace: /app/workspace"
echo "✓ Model: qwen/qwen3-coder:free (with fallbacks)"
echo "✓ Gateway port: ${PORT:-18789}"
echo "✓ Starting OpenClaw gateway..."

# Start the gateway (exec replaces shell so signals propagate correctly)
exec openclaw gateway
