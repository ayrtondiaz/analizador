import { keywordRule } from '../shared/keywords';
import { evaluate } from '../shared/scoring';
import { normalize, wordCount } from '../shared/text';
import type { AssetReport, Rule } from '../shared/types';
import {
  extractHeadline,
  extractLinkedInSlug,
  parseProfile,
  sectionItems,
  type ParsedProfile,
} from './sections';

export interface LinkedInContext {
  text: string;
  jobDescription?: string;
  profile: ParsedProfile;
  headline: string;
}

const WEAK_HEADLINE = /\b(looking for|seeking|en busca de|buscando|open to work|disponible para)\b/;

export function isRandomSlug(slug: string): boolean {
  return (
    /\d{3,}$/.test(slug) || /-(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{6,}$/.test(slug)
  );
}

function sectionWords(ctx: LinkedInContext, key: keyof ParsedProfile['sections']): number {
  return wordCount((ctx.profile.sections[key] ?? []).join(' '));
}

export const linkedInRules: readonly Rule<LinkedInContext>[] = [
  {
    id: 'li-headline',
    label: 'Titular con rol y palabras clave',
    weight: 14,
    lens: 'recruiter',
    tip: 'Reemplaza titulares genéricos ("Estudiante", "Buscando oportunidades") por tu rol y tecnologías, por ejemplo "Desarrollador Full Stack | React · Node.js · AWS".',
    check: ({ headline }) => {
      if (headline === '') return false;
      const n = normalize(headline);
      const words = wordCount(headline);
      if (WEAK_HEADLINE.test(n)) return false;
      if (/^(student|estudiante)$/.test(n.trim())) return false;
      return words >= 3 && headline.length >= 15;
    },
  },
  {
    id: 'li-about',
    label: 'Sección "Acerca de" con 100 palabras o más',
    weight: 12,
    lens: 'recruiter',
    tip: 'Redacta un resumen de al menos 100 palabras: quién eres, tu especialidad, logros clave y qué buscas.',
    check: (ctx) => sectionWords(ctx, 'about') >= 100,
  },
  {
    id: 'li-experience',
    label: 'Experiencia con descripciones',
    weight: 14,
    lens: 'ats',
    tip: 'Describe cada puesto con 2–4 líneas o viñetas de responsabilidades y resultados, no solo el cargo y la empresa.',
    check: ({ profile }) =>
      (profile.sections.experience ?? []).filter((l) => wordCount(l) >= 8).length >= 2,
  },
  {
    id: 'li-skills',
    label: 'Al menos 5 aptitudes',
    weight: 10,
    lens: 'ats',
    tip: 'Agrega como mínimo 5 aptitudes relevantes a tu perfil y pide validaciones de tus contactos.',
    check: ({ profile }) => {
      const skills = sectionItems(profile.sections.skills).length;
      const top = sectionItems(profile.sections.topSkills).length;
      // PDF exports list only the top 3 skills, so a short list cannot be judged.
      if (skills === 0 && top <= 3) return top === 0 ? false : null;
      return skills + top >= 5;
    },
  },
  {
    id: 'li-education',
    label: 'Formación académica',
    weight: 6,
    lens: 'ats',
    tip: 'Completa la sección de educación con institución, título y fechas.',
    check: ({ profile }) => (profile.sections.education ?? []).length > 0,
  },
  {
    id: 'li-custom-url',
    label: 'URL personalizada sin números aleatorios',
    weight: 4,
    lens: 'recruiter',
    tip: 'Personaliza tu URL (linkedin.com/in/nombre-apellido) desde "Editar perfil público y URL" para eliminar los números finales.',
    check: ({ text }) => {
      const slug = extractLinkedInSlug(text);
      return slug === null ? null : !isRandomSlug(slug);
    },
  },
  {
    id: 'li-certifications',
    label: 'Certificaciones o licencias (bonus)',
    weight: 4,
    lens: 'recruiter',
    tip: 'Si tienes certificaciones relevantes, agrégalas: suman credibilidad y palabras clave.',
    check: ({ profile }) => (profile.sections.certifications ?? []).length > 0,
  },
  {
    id: 'li-recommendations',
    label: 'Recomendaciones recibidas (bonus)',
    weight: 3,
    lens: 'recruiter',
    tip: 'Solicita 2–3 recomendaciones a antiguos jefes o colegas; son una prueba social muy valorada.',
    check: ({ profile }) => (profile.sections.recommendations ?? []).length > 0,
  },
  keywordRule<LinkedInContext>('li-jd-keywords', 15),
];

export function analyzeLinkedIn(text: string, jobDescription?: string): AssetReport {
  const profile = parseProfile(text);
  return evaluate(linkedInRules, {
    text,
    jobDescription,
    profile,
    headline: extractHeadline(profile, text),
  });
}
