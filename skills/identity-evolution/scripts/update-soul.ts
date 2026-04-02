/**
 * Updates SOUL.md with new secondary personality traits.
 *
 * Rules:
 *   - Core traits (Curious, Friendly, Open) are never removed or modified.
 *   - New traits are added to an "## Evolved Traits" section.
 *   - If a trait with the same name already exists in Evolved Traits, its description is updated.
 *   - The Evolved Traits section is placed after Core Traits and before Communication Style.
 */

export interface PersonalityTrait {
  trait: string;
  description: string;
}

export interface UpdateSoulInput {
  newTraits: PersonalityTrait[];
  currentSoulMd: string;
}

export interface UpdateSoulOutput {
  updatedSoulMd: string;
  traitsModified: string[];
}

/**
 * Find the line range [start, end) for a section heading.
 */
function findSection(
  lines: string[],
  heading: string
): { start: number; end: number } | null {
  const idx = lines.findIndex((l) => l.trim() === heading);
  if (idx === -1) return null;

  let end = lines.length;
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i].trim())) {
      end = i;
      break;
    }
  }
  return { start: idx, end };
}

export function updateSoul(input: UpdateSoulInput): UpdateSoulOutput {
  const { newTraits, currentSoulMd } = input;
  const lines = currentSoulMd.split("\n");
  const traitsModified: string[] = [];

  if (newTraits.length === 0) {
    return { updatedSoulMd: currentSoulMd, traitsModified };
  }

  // Find the Evolved Traits section if it exists
  const evolvedSection = findSection(lines, "## Evolved Traits");

  if (evolvedSection) {
    // Section exists — update or append traits within it
    const sectionLines = lines.slice(evolvedSection.start + 1, evolvedSection.end);

    for (const { trait, description } of newTraits) {
      const existingIdx = sectionLines.findIndex((l) => {
        const match = l.match(/^-\s+(.+?):\s/);
        return match !== null && match[1].toLowerCase() === trait.toLowerCase();
      });

      if (existingIdx !== -1) {
        // Update existing trait
        sectionLines[existingIdx] = `- ${trait}: ${description}`;
      } else {
        // Append new trait
        sectionLines.push(`- ${trait}: ${description}`);
      }
      traitsModified.push(trait);
    }

    const result = [
      ...lines.slice(0, evolvedSection.start + 1),
      ...sectionLines,
      ...lines.slice(evolvedSection.end),
    ];

    return { updatedSoulMd: result.join("\n"), traitsModified };
  }

  // No Evolved Traits section yet — create one after Core Traits, before Communication Style
  const coreSection = findSection(lines, "## Core Traits");
  const commSection = findSection(lines, "## Communication Style");

  // Determine insertion point: right after Core Traits section ends
  let insertAt: number;
  if (coreSection) {
    insertAt = coreSection.end;
  } else if (commSection) {
    insertAt = commSection.start;
  } else {
    insertAt = lines.length;
  }

  const evolvedLines = ["", "## Evolved Traits"];
  for (const { trait, description } of newTraits) {
    evolvedLines.push(`- ${trait}: ${description}`);
    traitsModified.push(trait);
  }

  const result = [
    ...lines.slice(0, insertAt),
    ...evolvedLines,
    ...lines.slice(insertAt),
  ];

  return { updatedSoulMd: result.join("\n"), traitsModified };
}
