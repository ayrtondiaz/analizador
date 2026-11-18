import { matchesHeading, nonEmptyLines } from '../shared/text';

export type SectionKey =
  | 'about'
  | 'experience'
  | 'education'
  | 'skills'
  | 'topSkills'
  | 'certifications'
  | 'recommendations'
  | 'contact'
  | 'other';

const HEADINGS: Record<SectionKey, readonly string[]> = {
  about: ['about', 'summary', 'acerca de', 'extracto', 'resumen', 'info'],
  experience: ['experience', 'experiencia'],
  education: ['education', 'educacion', 'formacion'],
  skills: ['skills', 'aptitudes', 'competencias', 'habilidades'],
  topSkills: ['top skills', 'principales aptitudes', 'aptitudes principales', 'principales competencias'],
  certifications: [
    'certifications',
    'licenses & certifications',
    'licenses and certifications',
    'licencias y certificaciones',
    'certificaciones',
    'licencias',
  ],
  recommendations: ['recommendations', 'recomendaciones'],
  contact: ['contact', 'contacto'],
  other: [
    'languages', 'idiomas', 'honors & awards', 'honors and awards', 'honores y premios', 'publications',
    'publicaciones', 'projects', 'proyectos', 'volunteer experience', 'voluntariado', 'courses', 'cursos',
    'patents', 'patentes', 'interests', 'intereses',
  ],
};

function detectSection(line: string): SectionKey | null {
  // Check longer, more specific headings first ("top skills" before "skills").
  const order: SectionKey[] = [
    'topSkills', 'certifications', 'recommendations', 'about', 'experience', 'education', 'skills', 'contact', 'other',
  ];
  for (const key of order) {
    if (matchesHeading(line, HEADINGS[key])) return key;
  }
  return null;
}

export interface ParsedProfile {
  /** Lines before the first recognized section. */
  preamble: string[];
  sections: Partial<Record<SectionKey, string[]>>;
}

const CONTACT_LINE = /@|linkedin\.com|https?:\/\/|www\.|\((?:linkedin|portfolio|blog|company website|personal|other|work|mobile|home)\)/i;
const TOP_SKILLS_LIMIT = 3;

/**
 * In a LinkedIn PDF export the sidebar blocks (Contact, Top Skills, Languages) come BEFORE the
 * name/headline block, with no heading in between. While the main sections have not started,
 * lines that cannot belong to a sidebar block spill over into the preamble.
 */
function belongsToSidebarBlock(key: SectionKey, line: string, itemsSoFar: number): boolean {
  switch (key) {
    case 'contact':
      return CONTACT_LINE.test(line);
    case 'topSkills':
      return itemsSoFar < TOP_SKILLS_LIMIT;
    case 'other':
      return /\([^)]*\)\s*$/.test(line);
    default:
      return true;
  }
}

export function parseProfile(text: string): ParsedProfile {
  const preamble: string[] = [];
  const sections: Partial<Record<SectionKey, string[]>> = {};
  let current: SectionKey | null = null;
  let mainStarted = false;
  let spilled = false;
  for (const line of nonEmptyLines(text)) {
    if (/^page \d+ of \d+$/i.test(line) || /^p[aá]gina \d+ de \d+$/i.test(line)) continue;
    const key = detectSection(line);
    if (key) {
      current = key;
      spilled = false;
      sections[key] ??= [];
      if (key === 'about' || key === 'experience' || key === 'education') mainStarted = true;
      continue;
    }
    if (!current || spilled) {
      preamble.push(line);
      continue;
    }
    const items = sections[current] ?? [];
    if (!mainStarted && !belongsToSidebarBlock(current, line, items.length)) {
      spilled = true;
      preamble.push(line);
      continue;
    }
    items.push(line);
  }
  return { preamble, sections };
}


/**
 * Headline detection. An explicit "Headline:" / "Titular:" line wins; otherwise the profile
 * block (name, headline, location) found before the first section is used. In a LinkedIn PDF
 * export the order is name, headline (possibly wrapped), location.
 */
export function extractHeadline(profile: ParsedProfile, text: string): string {
  const explicit = text.match(/^\s*(?:headline|titular)\s*:\s*(.+)$/im);
  if (explicit?.[1]) return explicit[1].trim();
  const lines = profile.preamble.filter((l) => !CONTACT_LINE.test(l));
  if (lines.length === 0) return '';
  if (lines.length === 1) return lines[0] ?? '';
  if (lines.length >= 4) return lines.slice(1, -1).join(' ');
  return lines[1] ?? '';
}

export function extractLinkedInSlug(text: string): string | null {
  const m = text.match(/linkedin\.com\/in\/([^\s/?#()]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]).toLowerCase() : null;
}

export function sectionItems(lines: readonly string[] | undefined): string[] {
  return (lines ?? [])
    .flatMap((l) => l.split(/[,•·|;]/))
    .map((s) => s.replace(/^[-–—*▪●◦]\s*/, '').trim())
    .filter((s) => s.length > 0);
}
