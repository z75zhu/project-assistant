#!/bin/bash
# Setup script for Discord Relationship Bot
# Run this after filling in your .env file

set -e

echo "🦞 Discord Relationship Bot — Setup"
echo ""

# Check for .env file
if [ ! -f .env ]; then
  echo "❌ No .env file found. Creating from template..."
  cp .env.example .env
  echo "📝 Please edit .env with your actual values, then run this script again."
  exit 1
fi

# Source .env
set -a
source .env
set +a

# Validate required vars
MISSING=""
[ -z "$DISCORD_BOT_TOKEN" ] || [ "$DISCORD_BOT_TOKEN" = "your_discord_bot_token_here" ] && MISSING="$MISSING DISCORD_BOT_TOKEN"
[ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ] && MISSING="$MISSING OPENAI_API_KEY"
[ -z "$DISCORD_GUILD_ID" ] || [ "$DISCORD_GUILD_ID" = "your_guild_id_here" ] && MISSING="$MISSING DISCORD_GUILD_ID"
[ -z "$DISCORD_CHANNEL_ID" ] || [ "$DISCORD_CHANNEL_ID" = "your_channel_id_here" ] && MISSING="$MISSING DISCORD_CHANNEL_ID"

if [ -n "$MISSING" ]; then
  echo "❌ Missing or placeholder values in .env:$MISSING"
  echo "   Edit .env with your actual values, then run this script again."
  exit 1
fi

echo "✓ Environment variables loaded"

# Get the absolute path to this project's workspace
WORKSPACE_DIR="$(cd "$(dirname "$0")/workspace" && pwd)"
SKILLS_DIR="$(cd "$(dirname "$0")/skills" && pwd)"

echo "✓ Workspace: $WORKSPACE_DIR"
echo "✓ Skills: $SKILLS_DIR"

# Create ~/.openclaw directory
mkdir -p ~/.openclaw

# Write the OpenClaw config
cat > ~/.openclaw/openclaw.json << JSONEOF
{
  // Discord Relationship Bot config
  "agents": {
    "defaults": {
      "workspace": "$WORKSPACE_DIR",
      "model": {
        "primary": "openai/gpt-4o-mini"
      },
      "heartbeat": {
        "every": "30m",
        "mode": "next-heartbeat"
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
        "apiKey": "\${OPENAI_API_KEY}"
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

echo "✓ OpenClaw config written to ~/.openclaw/openclaw.json"

# Write env vars to ~/.openclaw/.env so OpenClaw can pick them up
cat > ~/.openclaw/.env << ENVEOF
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
OPENAI_API_KEY=$OPENAI_API_KEY
ENVEOF

echo "✓ Credentials written to ~/.openclaw/.env"

# Copy skills to workspace if not already there
if [ -d "$SKILLS_DIR" ]; then
  mkdir -p "$WORKSPACE_DIR/../skills"
  echo "✓ Skills directory ready"
fi

echo ""
echo "🦞 Setup complete! Start the bot with:"
echo "   npx openclaw"
echo ""
echo "   Or run in verbose mode for debugging:"
echo "   npx openclaw --verbose"
