/**
 * Owner access control check.
 *
 * Returns whether the given Discord user ID belongs to one of the bot's owners.
 *
 * Requirements: 7.4
 */

const OWNER_DISCORD_IDS = new Set(['cm6550', 'ZhuZihao']);

export function checkOwner(input: { senderDiscordId: string }): { isOwner: boolean } {
  return { isOwner: OWNER_DISCORD_IDS.has(input.senderDiscordId) };
}
