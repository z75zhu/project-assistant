FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl jq \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw globally with Discord dependencies
RUN npm install -g openclaw@latest @buape/carbon @discordjs/core

WORKDIR /app

# Copy workspace, skills, and lib
COPY workspace/ ./workspace/
COPY skills/ ./skills/
COPY lib/ ./lib/

# Create directories OpenClaw needs
RUN mkdir -p /app/memory /app/logs \
    && chmod -R 777 /app/workspace /app/memory /app/logs

# Copy the startup script
COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]
