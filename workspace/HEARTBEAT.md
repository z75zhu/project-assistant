# Heartbeat — Proactive Outreach

This runs every 5 minutes. Follow these steps exactly.

## Step 1: Read files
Read USER.md, IDENTITY.md, SOUL.md, MEMORY.md.

## Step 2: Check if outreach is needed
Look at USER.md for these fields:
- "Last conversation at" — when the owner last sent a message
- "Last outreach at" — when you last proactively reached out
- "Consecutive ignored outreaches" — how many times the owner ignored you

### Rule A: Don't reach out if the owner just talked to you
If "Last conversation at" is less than 5 minutes ago, reply HEARTBEAT_OK. The conversation is still active.

### Rule B: Don't reach out if you already reached out since the last conversation
If "Last outreach at" is MORE RECENT than "Last conversation at", you already reached out after the last conversation ended.

If "Last outreach responded" is "pending", the owner hasn't responded yet. Wait before reaching out again:
- Consecutive ignored outreaches = 0 → wait 30 minutes since last outreach (first follow-up)
- Consecutive ignored outreaches = 1 → wait 2 hours since last outreach
- Consecutive ignored outreaches = 2 → wait 12 hours since last outreach
- Consecutive ignored outreaches >= 3 → wait 24 hours since last outreach

Before applying backoff, if "Last outreach responded" is still "pending", increment "Consecutive ignored outreaches" by 1 and set "Last outreach responded" to "no".

If the backoff time hasn't passed, reply HEARTBEAT_OK.

### Rule C: First outreach after a conversation ends
If "Last conversation at" is "never", reply HEARTBEAT_OK. You haven't talked to the owner yet — wait for them to start the conversation.

If "Last conversation at" is MORE RECENT than "Last outreach at" (or "Last outreach at" is "never" but "Last conversation at" is not "never"), AND at least 5 minutes have passed since "Last conversation at", you MUST send a message. This is your first outreach after the conversation ended. Do NOT skip this.

## Step 3: Send the message
Say something casual and natural based on what you know about the owner from USER.md and MEMORY.md. Keep it brief. One thought or question.

Do NOT say "SKIP" or "HEARTBEAT_OK" as your message. Those are internal signals, not messages to the owner.
Do NOT use the message tool. Do NOT use any tool to send the message. Just reply with the text directly — OpenClaw delivers your reply to Discord automatically.

After sending, edit USER.md:
- Set "Last outreach at" to the current timestamp
- Set "Last outreach responded" to "pending"
- If the previous "Last outreach responded" was "pending", increment "Consecutive ignored outreaches" first

## Step 4: If skipping
If Rules A or B say to skip, reply HEARTBEAT_OK. Nothing else.

Do NOT write observations to MEMORY.md when skipping. Do NOT edit any file when skipping. Just reply HEARTBEAT_OK and stop.
