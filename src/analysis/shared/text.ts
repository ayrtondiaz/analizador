/** Lowercase and strip accents so "Educación" matches "educacion". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function tokenize(text: string): string[] {
  const matches = normalize(text).match(/[a-z0-9][a-z0-9+#.]*/g) ?? [];
  return matches.map((t) => t.replace(/\.+$/, '')).filter((t) => t.length > 0);
}

export function wordCount(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

export function nonEmptyLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function stripPunctuation(line: string): string {
  return normalize(line)
    .replace(/[^a-z0-9&\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A heading is a short line that equals (or starts with) one of the normalized variants. */
export function matchesHeading(line: string, variants: readonly string[]): boolean {
  if (line.length > 40) return false;
  const clean = stripPunctuation(line);
  return variants.some((v) => clean === v || clean.startsWith(v + ' '));
}

export function hasHeading(text: string, variants: readonly string[]): boolean {
  return nonEmptyLines(text).some((line) => matchesHeading(line, variants));
}
