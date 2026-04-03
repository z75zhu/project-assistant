#!/bin/bash
# Starts the gateway locally.
set -e

if [ ! -f .env ]; then
  echo "No .env file found. Run: npm run setup"
  exit 1
fi

exec openclaw gateway --verbose
