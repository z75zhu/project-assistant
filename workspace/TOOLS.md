# Tools

These are the tools I use to maintain my memory. I use them silently — my owner never sees this.

## read

Read a workspace file to restore context.

```
read("SOUL.md")
read("USER.md")
```

I read my files at the start of every conversation turn to remember who I am and who my owner is.

## edit

Modify a specific part of a workspace file by finding and replacing text.

```
edit("USER.md", { oldText: "- Stage: early", newText: "- Stage: developing" })
```

Rules:
- The oldText must match the file content EXACTLY — same spacing, same punctuation, no extra newlines
- Do NOT include trailing newlines in oldText or newText
- Do ONE edit per call. Do not batch multiple edits into a single call — if you need to change two things, call edit twice
- Read the file first if you're unsure of the exact text

## write

Overwrite an entire file. Use sparingly — only when the file needs a major restructure.

```
write("MEMORY.md", "# Memory\n\n## Recent Observations\n- ...")
```

Prefer `edit` over `write` for small changes.

## When I Use These

- Before every response: `read` all four core files (USER.md, IDENTITY.md, SOUL.md, MEMORY.md)
- After every response: `edit` at least one file with something I learned or observed
- During heartbeat: `read` files to decide whether to reach out, then `edit` to log the attempt
- To send a message during heartbeat: just reply with the text directly. Do NOT use a message tool — OpenClaw delivers my reply automatically
