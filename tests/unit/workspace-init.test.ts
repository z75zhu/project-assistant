import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_DIR = path.resolve(__dirname, '../../workspace');

function readWorkspaceFile(filename: string): string {
  return fs.readFileSync(path.join(WORKSPACE_DIR, filename), 'utf-8');
}

describe('Workspace file initialization', () => {
  const workspaceFiles = [
    'SOUL.md',
    'IDENTITY.md',
    'USER.md',
    'MEMORY.md',
    'HEARTBEAT.md',
    'AGENTS.md',
  ];

  test.each(workspaceFiles)('%s exists and is non-empty', (filename) => {
    const content = readWorkspaceFile(filename);
    expect(content.length).toBeGreaterThan(0);
  });

  describe('SOUL.md', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkspaceFile('SOUL.md');
    });

    test('contains exactly three core traits: Curious, Friendly, Open', () => {
      expect(content).toContain('## Core Traits');
      expect(content).toContain('- Curious:');
      expect(content).toContain('- Friendly:');
      expect(content).toContain('- Open:');

      // Verify exactly three traits in the Core Traits section
      const coreTraitsSection = content.split('## Core Traits')[1].split('##')[0];
      const traitLines = coreTraitsSection
        .split('\n')
        .filter((line) => line.trim().startsWith('- '));
      expect(traitLines).toHaveLength(3);
    });

    test('contains a Communication Style section', () => {
      expect(content).toContain('## Communication Style');
    });
  });

  describe('USER.md', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkspaceFile('USER.md');
    });

    test('relationship section has Stage: early', () => {
      expect(content).toContain('- Stage: early');
    });

    test('contains owner Discord username cm6550', () => {
      expect(content).toContain('cm6550');
    });

    test('has sessions completed set to 0', () => {
      expect(content).toContain('- Sessions completed: 0');
    });

    test('has stable facts learned set to 0', () => {
      expect(content).toContain('- Stable facts learned: 0');
    });

    test('contains outreach tracking fields', () => {
      expect(content).toContain('- Last outreach at: never');
      expect(content).toContain('- Consecutive ignored outreaches: 0');
    });
  });

  describe('IDENTITY.md', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkspaceFile('IDENTITY.md');
    });

    test('name is not yet chosen', () => {
      expect(content).toContain('Not yet chosen');
    });

    test('avatar is not yet generated', () => {
      expect(content).toContain('Not yet generated');
    });
  });

  describe('MEMORY.md', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkspaceFile('MEMORY.md');
    });

    test('contains Recent Observations section', () => {
      expect(content).toContain('## Recent Observations');
    });

    test('contains Things Worth Remembering section', () => {
      expect(content).toContain('## Things Worth Remembering');
    });
  });

  describe('HEARTBEAT.md', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkspaceFile('HEARTBEAT.md');
    });

    test('contains Relationship Stage outreach logic', () => {
      expect(content).toContain('Relationship Stage');
      expect(content).toContain('minimum 4 hours');
      expect(content).toContain('minimum 24 hours');
    });

    test('contains Last Outreach Response backoff logic', () => {
      expect(content).toContain('Last Outreach Response');
      expect(content).toContain('wait at least 12 hours');
      expect(content).toContain('wait at least 48 hours');
    });

    test('contains Motivation Check section', () => {
      expect(content).toContain('Motivation Check');
    });
  });

  describe('AGENTS.md', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkspaceFile('AGENTS.md');
    });

    test('contains owner identification cm6550', () => {
      expect(content).toContain('cm6550');
    });

    test('contains conversation rules', () => {
      expect(content).toContain('## Conversation Rules');
    });

    test('contains safety rules', () => {
      expect(content).toContain('## Safety');
    });
  });
});
