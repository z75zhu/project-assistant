/**
 * Memory consolidation utility.
 *
 * Consolidates transient facts in MEMORY.md when they exceed 20 entries.
 * Groups related facts by simple keyword overlap and summarises each group
 * into a single concise entry, keeping MEMORY.md lean.
 *
 * Requirements: 4.4
 */

export interface ConsolidateMemoryInput {
  currentMemoryMd: string;
}

export interface ConsolidateMemoryOutput {
  updatedMemoryMd: string;
  originalCount: number;
  consolidatedCount: number;
}

const THRESHOLD = 20;
const GROUP_SIZE = 5;

/**
 * Extract bullet-point facts from the "## Things Worth Remembering" section.
 */
function extractTransientFacts(md: string): { before: string; facts: string[]; after: string } {
  const sectionHeader = '## Things Worth Remembering';
  const headerIdx = md.indexOf(sectionHeader);

  if (headerIdx === -1) {
    return { before: md, facts: [], after: '' };
  }

  const afterHeader = md.slice(headerIdx + sectionHeader.length);
  const before = md.slice(0, headerIdx + sectionHeader.length);

  // Find the next section header (## ...) or end of string
  const nextSectionMatch = afterHeader.match(/\n## /);
  let sectionBody: string;
  let after: string;

  if (nextSectionMatch && nextSectionMatch.index !== undefined) {
    sectionBody = afterHeader.slice(0, nextSectionMatch.index);
    after = afterHeader.slice(nextSectionMatch.index);
  } else {
    sectionBody = afterHeader;
    after = '';
  }

  const facts = sectionBody
    .split('\n')
    .filter((line) => line.trimStart().startsWith('- '))
    .map((line) => line.trim());

  return { before, facts, after };
}

/**
 * Extract meaningful keywords from a fact string (words >= 4 chars, lowercased).
 */
function extractKeywords(fact: string): Set<string> {
  const text = fact.replace(/^-\s*/, '').toLowerCase();
  const words = text.match(/[a-z]{4,}/g) || [];
  return new Set(words);
}

/**
 * Group facts by keyword overlap. Facts sharing at least one keyword are
 * placed in the same group. Falls back to batching in groups of ~GROUP_SIZE.
 */
function groupFacts(facts: string[]): string[][] {
  const groups: string[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < facts.length; i++) {
    if (assigned.has(i)) continue;

    const group: string[] = [facts[i]];
    assigned.add(i);
    const groupKeywords = extractKeywords(facts[i]);

    for (let j = i + 1; j < facts.length; j++) {
      if (assigned.has(j)) continue;

      const jKeywords = extractKeywords(facts[j]);
      let overlap = false;
      for (const kw of jKeywords) {
        if (groupKeywords.has(kw)) {
          overlap = true;
          break;
        }
      }

      if (overlap) {
        group.push(facts[j]);
        assigned.add(j);
        // Merge keywords
        for (const kw of jKeywords) {
          groupKeywords.add(kw);
        }
      }
    }

    groups.push(group);
  }

  // If grouping didn't reduce enough (e.g. all unique keywords), batch remaining
  // large groups into chunks of GROUP_SIZE
  const result: string[][] = [];
  for (const group of groups) {
    if (group.length > GROUP_SIZE * 2) {
      for (let i = 0; i < group.length; i += GROUP_SIZE) {
        result.push(group.slice(i, i + GROUP_SIZE));
      }
    } else {
      result.push(group);
    }
  }

  return result;
}

/**
 * Summarise a group of related facts into a single bullet entry.
 */
function summariseGroup(facts: string[]): string {
  if (facts.length === 1) {
    return facts[0];
  }

  // Collect all keywords to derive a topic label
  const allKeywords = new Set<string>();
  const cleanFacts: string[] = [];
  for (const fact of facts) {
    const text = fact.replace(/^-\s*/, '').trim();
    cleanFacts.push(text);
    for (const kw of extractKeywords(fact)) {
      allKeywords.add(kw);
    }
  }

  // Pick the most common keyword as the topic label
  const keywordCounts = new Map<string, number>();
  for (const fact of facts) {
    for (const kw of extractKeywords(fact)) {
      keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
    }
  }

  let topicLabel = 'General';
  let maxCount = 0;
  for (const [kw, count] of keywordCounts) {
    if (count > maxCount) {
      maxCount = count;
      topicLabel = kw.charAt(0).toUpperCase() + kw.slice(1);
    }
  }

  const summary = cleanFacts.join('; ');
  return `- [${topicLabel}]: ${summary}`;
}

export function consolidateMemory(input: ConsolidateMemoryInput): ConsolidateMemoryOutput {
  const { currentMemoryMd } = input;
  const { before, facts, after } = extractTransientFacts(currentMemoryMd);
  const originalCount = facts.length;

  if (originalCount <= THRESHOLD) {
    return {
      updatedMemoryMd: currentMemoryMd,
      originalCount,
      consolidatedCount: originalCount,
    };
  }

  const groups = groupFacts(facts);
  const consolidated = groups.map(summariseGroup);
  const consolidatedCount = consolidated.length;

  const newSection = '\n' + consolidated.join('\n') + '\n';
  const updatedMemoryMd = before + newSection + after;

  return {
    updatedMemoryMd,
    originalCount,
    consolidatedCount,
  };
}
