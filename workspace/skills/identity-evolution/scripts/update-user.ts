/**
 * Updates USER.md with new owner facts or corrections.
 *
 * Modes:
 *   - "append": adds new facts to the appropriate category section,
 *     removes placeholder text, increments stable facts count.
 *   - "correct": finds an existing fact by key and replaces its value,
 *     returns a correction log for the caller to write to the daily log.
 *
 * Category → section mapping:
 *   basic_info         → "## Basic Info"
 *   interests          → "## Interests"
 *   important_events   → "## Important Things They've Shared"
 *   communication_prefs→ "## Communication Preferences"
 *   relationships      → "## Relationship"
 */

export type FactCategory =
  | "basic_info"
  | "interests"
  | "important_events"
  | "communication_prefs"
  | "relationships";

export interface OwnerFact {
  key: string;
  value: string;
  category: FactCategory;
  priority: "normal" | "high";
}

export interface UpdateUserInput {
  facts: OwnerFact[];
  currentUserMd: string;
  mode: "append" | "correct";
}

export interface UpdateUserOutput {
  updatedUserMd: string;
  factsAdded: number;
  correctionLog?: string;
}

const CATEGORY_TO_SECTION: Record<FactCategory, string> = {
  basic_info: "## Basic Info",
  interests: "## Interests",
  important_events: "## Important Things They've Shared",
  communication_prefs: "## Communication Preferences",
  relationships: "## Relationship",
};

const PLACEHOLDER_PATTERNS = [
  /^\(None discovered yet\)$/,
  /^\(Nothing yet — we just met!\)$/,
  /^\(Still figuring out how they like to talk\)$/,
  /^\(Empty.*\)$/,
  /^-\s*Everything else:\s*still learning!$/,
];


function isPlaceholder(line: string): boolean {
  const trimmed = line.trim();
  return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

function formatFact(fact: OwnerFact): string {
  const prefix = fact.priority === "high" ? "⭐ " : "";
  return `- ${prefix}${fact.key}: ${fact.value}`;
}

/**
 * Find the line range for a given section heading.
 * Returns [startIndex, endIndex) where startIndex is the heading line
 * and endIndex is the line before the next heading (or end of file).
 */
function findSection(
  lines: string[],
  heading: string
): { start: number; end: number } | null {
  const headingIndex = lines.findIndex(
    (l) => l.trim() === heading
  );
  if (headingIndex === -1) return null;

  let end = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i].trim())) {
      end = i;
      break;
    }
  }
  return { start: headingIndex, end };
}

/**
 * Read the current "Stable facts learned" count from the Relationship section.
 */
function getStableFactsCount(lines: string[]): number {
  for (const line of lines) {
    const match = line.match(/^-\s*Stable facts learned:\s*(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Increment the "Stable facts learned" count by the given amount.
 */
function incrementStableFacts(lines: string[], count: number): string[] {
  return lines.map((line) => {
    const match = line.match(/^(-\s*Stable facts learned:\s*)(\d+)/);
    if (match) {
      const current = parseInt(match[2], 10);
      return `${match[1]}${current + count}`;
    }
    return line;
  });
}

function appendFacts(input: UpdateUserInput): UpdateUserOutput {
  const { facts, currentUserMd } = input;
  let lines = currentUserMd.split("\n");
  let factsAdded = 0;

  // Group facts by category for efficient insertion
  const factsByCategory = new Map<FactCategory, OwnerFact[]>();
  for (const fact of facts) {
    const group = factsByCategory.get(fact.category) || [];
    group.push(fact);
    factsByCategory.set(fact.category, group);
  }

  for (const [category, categoryFacts] of factsByCategory) {
    const heading = CATEGORY_TO_SECTION[category];
    const section = findSection(lines, heading);
    if (!section) continue;

    // Find content lines within the section (between heading and next heading)
    const contentStart = section.start + 1;
    const contentEnd = section.end;

    // Remove placeholder lines within the section
    const cleaned: string[] = [];
    for (let i = contentStart; i < contentEnd; i++) {
      if (!isPlaceholder(lines[i])) {
        cleaned.push(lines[i]);
      }
    }

    // Build new fact lines
    const newFactLines = categoryFacts.map(formatFact);
    factsAdded += categoryFacts.length;

    // Reconstruct the section: heading + cleaned content + new facts
    const before = lines.slice(0, contentStart);
    const after = lines.slice(contentEnd);
    lines = [...before, ...cleaned, ...newFactLines, ...after];
  }

  // Increment stable facts count
  if (factsAdded > 0) {
    lines = incrementStableFacts(lines, factsAdded);
  }

  return {
    updatedUserMd: lines.join("\n"),
    factsAdded,
  };
}

function correctFacts(input: UpdateUserInput): UpdateUserOutput {
  const { facts, currentUserMd } = input;
  let lines = currentUserMd.split("\n");
  const corrections: string[] = [];
  let factsAdded = 0;

  for (const fact of facts) {
    // Find a line that contains the key (as a bullet point)
    const lineIndex = lines.findIndex((line) => {
      const trimmed = line.trim();
      // Match lines like "- key: value" or "- ⭐ key: value"
      return (
        trimmed.startsWith("- ") &&
        (trimmed.includes(`${fact.key}:`) || trimmed.includes(`⭐ ${fact.key}:`))
      );
    });

    if (lineIndex === -1) continue;

    const oldLine = lines[lineIndex];
    // Extract old value
    const colonIndex = oldLine.indexOf(`${fact.key}:`);
    const oldValue = colonIndex !== -1
      ? oldLine.slice(colonIndex + fact.key.length + 1).trim()
      : "unknown";

    // Replace with new value
    lines[lineIndex] = formatFact(fact);
    factsAdded++;

    corrections.push(
      `- **Field**: ${fact.key}\n- **Old value**: ${oldValue}\n- **New value**: ${fact.value}`
    );
  }

  const correctionLog =
    corrections.length > 0
      ? `## Correction\n${corrections.join("\n")}\n- **Timestamp**: ${new Date().toISOString()}`
      : undefined;

  return {
    updatedUserMd: lines.join("\n"),
    factsAdded,
    correctionLog,
  };
}

export function updateUser(input: UpdateUserInput): UpdateUserOutput {
  if (input.mode === "correct") {
    return correctFacts(input);
  }
  return appendFacts(input);
}
