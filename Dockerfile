FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl jq \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw globally
RUN npm install -g openclaw@latest

WORKDIR /app

# Copy project files
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy workspace, skills, lib, and config
COPY workspace/ ./workspace/
COPY skills/ ./skills/
COPY lib/ ./lib/
COPY index.ts ./

# Create directories OpenClaw needs
RUN mkdir -p /home/node/.openclaw/agents/main/sessions \
    && mkdir -p /app/memory \
    && mkdir -p /app/logs

# Copy the startup script
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 18789

CMD ["./start.sh"]
