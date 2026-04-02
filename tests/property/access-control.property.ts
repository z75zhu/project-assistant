// Feature: discord-relationship-bot, Property 8: Owner-only access control
// **Validates: Requirements 7.4**

import * as fc from 'fast-check';
import { checkOwner } from '../../lib/check-owner';

const OWNER_IDS = ['cm6550', 'ZhuZihao'];

/** Generate a random Discord user ID that is NOT an owner. */
const nonOwnerIdArb = fc.string({ minLength: 1, maxLength: 30 }).filter((id) => !OWNER_IDS.includes(id));

describe('Property 8: Owner-only access control', () => {
  it('should return isOwner=false for non-owner IDs', () => {
    fc.assert(
      fc.property(nonOwnerIdArb, (userId) => {
        const result = checkOwner({ senderDiscordId: userId });
        expect(result.isOwner).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should return isOwner=true for all registered owners', () => {
    for (const ownerId of OWNER_IDS) {
      const result = checkOwner({ senderDiscordId: ownerId });
      expect(result.isOwner).toBe(true);
    }
  });

  it('should correctly classify any random string', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        (userId) => {
          const result = checkOwner({ senderDiscordId: userId });
          if (OWNER_IDS.includes(userId)) {
            expect(result.isOwner).toBe(true);
          } else {
            expect(result.isOwner).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
