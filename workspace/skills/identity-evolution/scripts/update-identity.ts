/**
 * Updates IDENTITY.md by replacing the content of a specific field section.
 *
 * Field → section mapping:
 *   "name"   → "## Name"
 *   "avatar" → "## Avatar"
 *   "about"  → "## About Me"
 *
 * The function replaces all content between the target heading and the next
 * heading (or end of file) with the new value, preserving all other sections.
 */

export type IdentityField = "name" | "avatar" | "about";

export interface UpdateIdentityInput {
  field: IdentityField;
  value: string;
  currentIdentityMd: string;
}

export interface UpdateIdentityOutput {
  updatedIdentityMd: string;
}

const FIELD_TO_HEADING: Record<IdentityField, string> = {
  name: "## Name",
  avatar: "## Avatar",
  about: "## About Me",
};

export function updateIdentity(input: UpdateIdentityInput): UpdateIdentityOutput {
  const { field, value, currentIdentityMd } = input;
  const heading = FIELD_TO_HEADING[field];
  const lines = currentIdentityMd.split("\n");

  const headingIdx = lines.findIndex((l) => l.trim() === heading);
  if (headingIdx === -1) {
    // Section not found — append it at the end
    const result = [...lines, "", heading, value];
    return { updatedIdentityMd: result.join("\n") };
  }

  // Find the next heading after this one
  let nextHeadingIdx = lines.length;
  for (let i = headingIdx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i].trim())) {
      nextHeadingIdx = i;
      break;
    }
  }

  const result = [
    ...lines.slice(0, headingIdx + 1),
    value,
    "",
    ...lines.slice(nextHeadingIdx),
  ];

  return { updatedIdentityMd: result.join("\n") };
}
