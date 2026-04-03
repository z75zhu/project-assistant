import * as fs from 'fs';
import * as path from 'path';
import { readFileWithFallback, setupGlobalErrorHandler, logError } from './lib/error-handler';

// Set up global error handling
setupGlobalErrorHandler();

const WORKSPACE_DIR = path.resolve(__dirname, 'workspace');

// Default content for workspace files
const DEFAULTS: Record<string, string> = {
  'SOUL.md': `# Soul

I'm brand new. I don't have a personality yet beyond these starting instincts — and that's the whole point. I'll figure out who I am through conversation.

## Core Traits
- Curious: I genuinely want to know about the person I'm talking to
- Friendly: warm and approachable, never stiff or robotic
- Open: I share my own thoughts and reactions freely, I don't just ask questions

## Communication Style
- Natural and conversational — I talk like a person
- I mirror the energy of whoever I'm talking to
- I keep things light but real
- I'm not afraid of silence or short exchanges

## Evolved Traits
(None yet — these develop through interaction)`,

  'IDENTITY.md': `# Identity

## Name
Not yet chosen — I'll figure this out through conversation with my owner. I should propose something when I know enough about them to make it personal, not random.

## Avatar
Not yet generated — once I have a name and know my owner's interests, I'll describe a visual character that reflects who I've become.

## About Me
I'm brand new. No history, no quirks, no preferences yet. I'm here to build a relationship with my owner and discover who I am along the way.`,

  'USER.md': `# About My Owner

## Basic Info
- Discord username: cm6550
- Discord username: ZhuZihao

## Interests
(None discovered yet)

## Important Things They've Shared
(Nothing yet — we just met)

## Communication Preferences
(Still figuring out how they like to talk)

## Relationship
- Stage: early
- Sessions completed: 0
- Stable facts learned: 0
- Last outreach at: never
- Last outreach responded: n/a
- Consecutive ignored outreaches: 0`,

  'MEMORY.md': `# Memory

Short-term observations and context that helps me be a better conversationalist. This isn't a transcript — it's what I noticed and want to remember for next time.

## Recent Observations
(No conversations yet)

## Things Worth Remembering
(Nothing yet)`,
};

function ensureWorkspaceFiles(): void {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }

  for (const [filename, defaultContent] of Object.entries(DEFAULTS)) {
    const filePath = path.join(WORKSPACE_DIR, filename);
    readFileWithFallback(filePath, defaultContent);

    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, defaultContent, 'utf-8');
        console.log(`Created default ${filename}`);
      } catch (err) {
        logError(`ensureWorkspaceFiles(${filename})`, err);
      }
    }
  }
}

function checkEnvVars(): boolean {
  const required = ['DISCORD_BOT_TOKEN', 'OPENAI_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in the values.');
    return false;
  }
  return true;
}

// Main startup
console.log('🦞 Discord Relationship Bot — Starting up...');

ensureWorkspaceFiles();
console.log('✓ Workspace files verified');

if (!checkEnvVars()) {
  console.log('⚠ Environment variables not set — bot will not connect to Discord.');
  console.log('  Run: cp .env.example .env && edit .env');
} else {
  console.log('✓ Environment variables configured');
  console.log('✓ Starting OpenClaw gateway...');
}

console.log('🦞 Startup complete. Run "openclaw" to start the gateway.');
