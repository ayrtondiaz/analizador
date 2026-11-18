import { keywordRule } from '../shared/keywords';
import { evaluate } from '../shared/scoring';
import { hasHeading, nonEmptyLines, normalize, tokenize, wordCount } from '../shared/text';
import type { AssetReport, Rule } from '../shared/types';

export interface CvContext {
  text: string;
  jobDescription?: string;
}

const EXPERIENCE = [
  'experience',
  'work experience',
  'professional experience',
  'employment history',
  'work history',
  'experiencia',
  'experiencia laboral',
  'experiencia profesional',
  'trayectoria profesional',
];
const EDUCATION = ['education', 'academic background', 'educacion', 'formacion', 'formacion academica', 'estudios'];
const SKILLS = [
  'skills',
  'technical skills',
  'core skills',
  'habilidades',
  'competencias',
  'conocimientos',
  'aptitudes',
  'tecnologias',
];

const ACTION_VERBS = new Set(
  [
    // English
    'led', 'managed', 'developed', 'built', 'designed', 'implemented', 'created', 'improved', 'increased',
    'reduced', 'launched', 'delivered', 'optimized', 'automated', 'coordinated', 'analyzed', 'architected',
    'migrated', 'mentored', 'achieved', 'established', 'drove', 'deployed', 'maintained', 'collaborated',
    'negotiated', 'streamlined', 'refactored', 'integrated', 'owned',
    // Spanish
    'lidere', 'gestione', 'desarrolle', 'construi', 'disene', 'implemente', 'cree', 'mejore', 'aumente',
    'reduje', 'lance', 'entregue', 'optimice', 'automatice', 'coordine', 'analice', 'migre', 'logre',
    'dirigi', 'administre', 'desplegue', 'mantuve', 'colabore', 'programe', 'integre', 'negocie',
    'lidero', 'gestiono', 'desarrollo', 'implemento', 'disenio', 'cree', 'mejoro', 'optimizo', 'reduce',
    'redujo', 'aumento', 'coordino', 'analizo', 'dirigio', 'administro', 'desplego',
  ].map(normalize),
);

const FIRST_PERSON = new Set(['i', 'my', 'me', 'myself', 'yo', 'mi', 'mis']);

const MONTHS =
  'jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|ene|abr|ago|dic|january|february|march|april|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';

type DateFormat = 'numeric' | 'iso' | 'month-name' | 'year';

export function detectDateFormats(text: string): DateFormat[] {
  const t = normalize(text);
  const found: DateFormat[] = [];
  const withoutIso = t.replace(/\b(?:19|20)\d{2}-(?:0[1-9]|1[0-2])\b/g, () => {
    found.push('iso');
    return ' ';
  });
  const withoutNumeric = withoutIso.replace(/\b(?:0?[1-9]|1[0-2])[/.-](?:19|20)\d{2}\b/g, () => {
    found.push('numeric');
    return ' ';
  });
  const withoutNamed = withoutNumeric.replace(
    new RegExp(`\\b(?:${MONTHS})\\.?\\s+(?:de\\s+)?(?:19|20)\\d{2}\\b`, 'g'),
    () => {
      found.push('month-name');
      return ' ';
    },
  );
  const years = withoutNamed.match(/\b(?:19|20)\d{2}\b/g) ?? [];
  for (let i = 0; i < years.length; i++) found.push('year');
  return found;
}

const PHONE_LIKE = /\+?\d[\d\s().-]{7,}\d/g;

export function hasPhone(text: string): boolean {
  const cleaned = text
    .replace(/\S+@\S+/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/g, ' ')
    .replace(/(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|\w+)/g, ' ');
  return (cleaned.match(PHONE_LIKE) ?? []).some((m) => {
    const digits = m.replace(/\D/g, '').length;
    return digits >= 9 && digits <= 15;
  });
}

export function countQuantified(text: string): number {
  const cleaned = text
    .replace(/\S+@\S+/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/g, ' ')
    .replace(PHONE_LIKE, ' ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ');
  return (cleaned.match(/\d+(?:[.,]\d+)?/g) ?? []).length;
}

export const cvRules: readonly Rule<CvContext>[] = [
  {
    id: 'cv-readable',
    label: 'El texto del CV es legible por un ATS',
    weight: 25,
    lens: 'ats',
    tip: 'Se extrajo muy poco texto: el archivo probablemente es una imagen escaneada. Exporta el CV como PDF con texto seleccionable (desde Word o Google Docs), no como imagen.',
    check: ({ text }) => wordCount(text) >= 50,
  },
  {
    id: 'cv-email',
    label: 'Incluye un correo electrónico',
    weight: 8,
    lens: 'ats',
    tip: 'Agrega un correo electrónico de contacto en el encabezado, escrito como texto simple.',
    check: ({ text }) => /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text),
  },
  {
    id: 'cv-phone',
    label: 'Incluye un teléfono',
    weight: 6,
    lens: 'ats',
    tip: 'Agrega un número de teléfono con código de país (por ejemplo +54 9 387 000 0000).',
    check: ({ text }) => hasPhone(text),
  },
  {
    id: 'cv-sections',
    label: 'Secciones estándar (experiencia, educación, habilidades)',
    weight: 12,
    lens: 'ats',
    tip: 'Usa títulos convencionales como "Experiencia", "Educación" y "Habilidades" (o sus equivalentes en inglés) para que el ATS clasifique bien tu contenido.',
    check: ({ text }) =>
      hasHeading(text, EXPERIENCE) && hasHeading(text, EDUCATION) && hasHeading(text, SKILLS),
  },
  {
    id: 'cv-dates',
    label: 'Fechas presentes y con formato consistente',
    weight: 6,
    lens: 'ats',
    tip: 'Indica las fechas de cada puesto y usa un solo formato (por ejemplo "Mar 2021 – Ene 2023" o "03/2021 – 01/2023") en todo el documento.',
    check: ({ text }) => {
      const formats = detectDateFormats(text);
      if (formats.length < 2) return false;
      const detailed = new Set(formats.filter((f) => f !== 'year'));
      return detailed.size <= 1;
    },
  },
  keywordRule<CvContext>('cv-jd-keywords', 15),
  {
    id: 'cv-links',
    label: 'Enlaces a LinkedIn, GitHub o portafolio',
    weight: 6,
    lens: 'recruiter',
    tip: 'Incluye al menos un enlace profesional (LinkedIn, GitHub o tu portafolio) en el encabezado.',
    check: ({ text }) => /linkedin\.com\/in\/|github\.com\/|https?:\/\/(?!(?:www\.)?(?:linkedin|github)\.)[\w.-]+\.[a-z]{2,}/i.test(text),
  },
  {
    id: 'cv-length',
    label: 'Extensión adecuada (300–1000 palabras)',
    weight: 6,
    lens: 'recruiter',
    tip: 'Un CV demasiado corto parece vacío y uno demasiado largo no se lee. Apunta a 1–2 páginas (300 a 1000 palabras).',
    check: ({ text }) => {
      const words = wordCount(text);
      return words >= 300 && words <= 1000;
    },
  },
  {
    id: 'cv-quantified',
    label: 'Logros cuantificados (cifras, %, $)',
    weight: 12,
    lens: 'recruiter',
    tip: 'Respalda tus logros con números: porcentajes, montos, tamaño de equipo, usuarios o tiempo ahorrado.',
    check: ({ text }) => countQuantified(text) >= 3,
  },
  {
    id: 'cv-action-verbs',
    label: 'Verbos de acción (≥ 5 distintos)',
    weight: 8,
    lens: 'recruiter',
    tip: 'Comienza cada viñeta con un verbo de acción (lideré, desarrollé, implementé / led, built, delivered).',
    check: ({ text }) => new Set(tokenize(text).filter((t) => ACTION_VERBS.has(t))).size >= 5,
  },
  {
    id: 'cv-first-person',
    label: 'Sin exceso de pronombres en primera persona',
    weight: 4,
    lens: 'recruiter',
    tip: 'Evita "yo", "mi" o "I", "my" en las descripciones. Escribe frases directas que comiencen con el verbo.',
    check: ({ text }) => {
      const tokens = tokenize(text);
      if (tokens.length === 0) return false;
      const count = tokens.filter((t) => FIRST_PERSON.has(t)).length;
      return count / tokens.length <= 0.02;
    },
  },
  {
    id: 'cv-bullets',
    label: 'Uso de viñetas',
    weight: 5,
    lens: 'recruiter',
    tip: 'Organiza tus responsabilidades y logros en viñetas cortas; los reclutadores escanean, no leen párrafos.',
    check: ({ text }) => nonEmptyLines(text).filter((l) => /^[•\-–—*▪●·◦▸►]\s*\S/.test(l)).length >= 5,
  },
];

export function analyzeCv(text: string, jobDescription?: string): AssetReport {
  return evaluate(cvRules, { text, jobDescription });
}
