#!/bin/bash
set -e

echo "🦞 Discord Relationship Bot — Starting on Railway"

# Debug: show which env vars are set (values masked)
echo "DEBUG: DISCORD_BOT_TOKEN is $([ -n "$DISCORD_BOT_TOKEN" ] && echo 'SET' || echo 'EMPTY')"
echo "DEBUG: OPENAI_API_KEY is $([ -n "$OPENAI_API_KEY" ] && echo 'SET' || echo 'EMPTY')"
echo "DEBUG: DISCORD_GUILD_ID is $([ -n "$DISCORD_GUILD_ID" ] && echo 'SET' || echo 'EMPTY')"
echo "DEBUG: DISCORD_CHANNEL_ID is $([ -n "$DISCORD_CHANNEL_ID" ] && echo 'SET' || echo 'EMPTY')"
echo "DEBUG: PORT is ${PORT:-not set}"
echo "DEBUG: HOME is $HOME"
echo "DEBUG: Total env var count: $(env | wc -l)"

# Validate required env vars
MISSING=""
[ -z "$DISCORD_BOT_TOKEN" ] && MISSING="$MISSING DISCORD_BOT_TOKEN"
[ -z "$OPENAI_API_KEY" ] && MISSING="$MISSING OPENAI_API_KEY"
[ -z "$DISCORD_GUILD_ID" ] && MISSING="$MISSING DISCORD_GUILD_ID"
[ -z "$DISCORD_CHANNEL_ID" ] && MISSING="$MISSING DISCORD_CHANNEL_ID"

if [ -n "$MISSING" ]; then
  echo "❌ Missing required environment variables:$MISSING"
  echo "DEBUG: Listing all env var names:"
  env | cut -d= -f1 | sort
  # Sleep before exit so Railway logs can be read
  sleep 30
  exit 1
fi

# Generate a gateway token if not provided
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-railway-$(cat /proc/sys/kernel/random/uuid 2>/dev/null || node -e 'process.stdout.write(require("crypto").randomUUID())')}"

# Determine home dir
OPENCLAW_HOME="${HOME}/.openclaw"
mkdir -p "$OPENCLAW_HOME/agents/main/sessions"

# Write OpenClaw config from environment variables
cat > "$OPENCLAW_HOME/openclaw.json" << JSONEOF
{
  "gateway": {
    "mode": "local",
    "port": ${PORT:-18789},
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "$GATEWAY_TOKEN"
    }
  },
  "session": {
    "store": "/app/sessions.json"
  },
  "plugins": {
    "slots": {
      "memory": "none"
    }
  },
  "agents": {
    "defaults": {
      "workspace": "/app/workspace",
      "skipBootstrap": true,
      "model": {
        "primary": "openai/gpt-5.4-mini"
      },
      "contextTokens": 32000,
      "heartbeat": {
        "every": "5m",
        "target": "discord"
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
      "openai": {
        "apiKey": "\${OPENAI_API_KEY}",
        "baseUrl": "https://api.openai.com/v1",
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
OPENAI_API_KEY=$OPENAI_API_KEY
ENVEOF

chmod 700 "$OPENCLAW_HOME"
chmod 600 "$OPENCLAW_HOME/openclaw.json"
chmod 600 "$OPENCLAW_HOME/.env"

echo "✓ Config written to $OPENCLAW_HOME/openclaw.json"
echo "✓ Workspace: /app/workspace"
echo "✓ Model: openai/gpt-5.4-mini"
echo "✓ Gateway port: ${PORT:-18789}"
echo "✓ Starting OpenClaw gateway..."

# Start the gateway
exec openclaw gateway
