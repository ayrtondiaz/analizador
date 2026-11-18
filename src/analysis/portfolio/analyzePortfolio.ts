import { keywordRule } from '../shared/keywords';
import { evaluate } from '../shared/scoring';
import { normalize, wordCount } from '../shared/text';
import type { AssetReport, Rule } from '../shared/types';
import { getAttr, getHrefs, getMetaContent, getTags, getTitle, visibleText } from './html';

export interface PortfolioInput {
  url: string;
  /** Pasted page source ("view-source"). Optional: browsers cannot fetch arbitrary sites (CORS). */
  html?: string;
}

export interface PortfolioContext {
  url: string;
  html: string;
  /** Visible text of the page (empty without HTML). */
  text: string;
  jobDescription?: string;
}

const GENERIC_HOSTS = [
  'github.io', 'netlify.app', 'vercel.app', 'wixsite.com', 'wordpress.com', 'blogspot.com', 'herokuapp.com',
  'pages.dev', 'web.app', 'firebaseapp.com', 'framer.website', 'framer.app', 'carrd.co', 'notion.site', 'webflow.io',
  'glitch.me', 'repl.co', 'onrender.com', 'surge.sh', 'weebly.com', 'squarespace.com',
];

const SOCIAL_HOSTS = [
  'github.com', 'linkedin.com', 'twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'youtube.com',
  'medium.com', 'dev.to', 'behance.net', 'dribbble.com', 'wa.me', 'whatsapp.com', 't.me',
];

const GENERIC_TITLES = new Set([
  'home', 'index', 'document', 'untitled', 'my website', 'my portfolio', 'portfolio', 'portafolio', 'react app',
  'vite app', 'vite + react', 'vite + react + ts', 'mi sitio', 'inicio', 'sin titulo', 'welcome',
]);

const PROJECT_HEADING = /project|proyecto|trabajos|work|portfolio|portafolio|casos/i;

function hostOf(url: string): string {
  const m = url.trim().match(/^(?:[a-z][a-z0-9+.-]*:\/\/)?([^/?#:]+)/i);
  return (m?.[1] ?? '').toLowerCase().replace(/^www\./, '');
}

function hostMatches(host: string, list: readonly string[]): boolean {
  return list.some((h) => host === h || host.endsWith('.' + h));
}

export function countProjects(html: string): number {
  const articles = getTags(html, 'article').length;
  const classCards = getTags(html, '(?:div|li|section|a)').filter((tag) =>
    /(^|[\s_-])(project|proyecto|card|work-item|case-study)s?([\s_-]|$)/i.test(getAttr(tag, 'class') ?? ''),
  ).length;

  // Headings (h3/h4) following a heading that mentions projects.
  let headingCount = 0;
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const sectionIndex = headings.findIndex(
    (h) => /^[1-3]$/.test(h[1] ?? '') && PROJECT_HEADING.test(visibleText(h[2] ?? '')),
  );
  if (sectionIndex >= 0) {
    const level = Number(headings[sectionIndex]?.[1]);
    for (const h of headings.slice(sectionIndex + 1)) {
      const l = Number(h[1]);
      if (l <= level) break;
      headingCount++;
    }
  }
  return Math.max(articles, classCards, headingCount);
}

/** Wraps a rule so it is skipped when no HTML was pasted. */
function htmlRule(rule: Rule<PortfolioContext>): Rule<PortfolioContext> {
  return { ...rule, check: (ctx) => (ctx.html.trim() === '' ? null : rule.check(ctx)) };
}

/** Wraps a rule so it is skipped when no URL was given. */
function urlRule(rule: Rule<PortfolioContext>): Rule<PortfolioContext> {
  return { ...rule, check: (ctx) => (ctx.url.trim() === '' ? null : rule.check(ctx)) };
}

export const portfolioRules: readonly Rule<PortfolioContext>[] = [
  urlRule({
    id: 'pf-https',
    label: 'La URL usa HTTPS',
    weight: 8,
    lens: 'ats',
    tip: 'Publica el sitio con HTTPS. Los navegadores marcan como "no seguro" a los sitios HTTP y los reclutadores lo notan.',
    check: ({ url }) => /^https:\/\//i.test(url.trim()),
  }),
  urlRule({
    id: 'pf-custom-domain',
    label: 'Dominio propio (informativo)',
    weight: 3,
    lens: 'recruiter',
    tip: 'Un dominio propio (tunombre.com) transmite más profesionalismo que un subdominio gratuito. Es un detalle menor.',
    check: ({ url }) => !hostMatches(hostOf(url), GENERIC_HOSTS),
  }),
  htmlRule({
    id: 'pf-title',
    label: 'Título de página con nombre o rol',
    weight: 8,
    lens: 'ats',
    tip: 'Define un <title> descriptivo, por ejemplo "Ana Pérez — Desarrolladora Frontend", no "Home" ni el nombre de una plantilla.',
    check: ({ html }) => {
      const title = getTitle(html);
      return title !== '' && wordCount(title) >= 2 && !GENERIC_TITLES.has(normalize(title));
    },
  }),
  htmlRule({
    id: 'pf-meta-description',
    label: 'Meta descripción presente',
    weight: 7,
    lens: 'ats',
    tip: 'Agrega <meta name="description"> con 1–2 frases (más de 50 caracteres) que resuman quién eres y qué haces.',
    check: ({ html }) => getMetaContent(html, 'description').length >= 50,
  }),
  htmlRule({
    id: 'pf-viewport',
    label: 'Optimizado para móviles (meta viewport)',
    weight: 6,
    lens: 'ats',
    tip: 'Agrega <meta name="viewport" content="width=device-width, initial-scale=1"> para que el sitio se vea bien en celulares.',
    check: ({ html }) => getMetaContent(html, 'viewport') !== '',
  }),
  htmlRule({
    id: 'pf-projects',
    label: 'Al menos 3 proyectos visibles',
    weight: 14,
    lens: 'recruiter',
    tip: 'Muestra como mínimo 3 proyectos, cada uno con título, tecnologías y resultado. Usa <article> o tarjetas claramente separadas.',
    check: ({ html }) => countProjects(html) >= 3,
  }),
  htmlRule({
    id: 'pf-links',
    label: 'Enlaces a GitHub y a demos en vivo',
    weight: 8,
    lens: 'recruiter',
    tip: 'Enlaza tu perfil de GitHub y agrega una demo en vivo o repositorio por cada proyecto.',
    check: ({ html }) => {
      const hrefs = getHrefs(html).filter((h) => /^https?:\/\//i.test(h));
      const github = hrefs.some((h) => hostOf(h) === 'github.com');
      const demo = hrefs.some((h) => !hostMatches(hostOf(h), SOCIAL_HOSTS));
      return github && demo;
    },
  }),
  htmlRule({
    id: 'pf-contact',
    label: 'Información o enlace de contacto',
    weight: 10,
    lens: 'recruiter',
    tip: 'Incluye un correo (mailto:), un formulario o un enlace claro de "Contacto" visible sin desplazarse mucho.',
    check: ({ html }) =>
      /href\s*=\s*["']?mailto:/i.test(html) ||
      getTags(html, 'form').length > 0 ||
      getHrefs(html).some((h) => /contact|contacto/i.test(h)) ||
      /<a\b[^>]*>\s*(?:contact|contacto|cont[aá]ctame|contact me)\s*<\/a>/i.test(html),
  }),
  htmlRule({
    id: 'pf-img-alt',
    label: 'Las imágenes tienen texto alternativo',
    weight: 6,
    lens: 'ats',
    tip: 'Agrega un atributo alt descriptivo a cada imagen: mejora la accesibilidad y el posicionamiento.',
    check: ({ html }) => {
      const imgs = getTags(html, 'img');
      if (imgs.length === 0) return null;
      return imgs.every((tag) => (getAttr(tag, 'alt') ?? '').trim() !== '');
    },
  }),
  htmlRule({
    id: 'pf-size',
    label: 'Peso del HTML razonable',
    weight: 4,
    lens: 'ats',
    tip: 'El HTML supera los 500 KB. Reduce contenido incrustado (imágenes en base64, scripts en línea) para que cargue rápido.',
    check: ({ html }) => html.length < 500_000,
  }),
  htmlRule(keywordRule<PortfolioContext>('pf-jd-keywords', 15)),
];

export function analyzePortfolio(input: PortfolioInput, jobDescription?: string): AssetReport {
  const html = input.html ?? '';
  return evaluate(portfolioRules, {
    url: input.url,
    html,
    text: html.trim() === '' ? '' : visibleText(html),
    jobDescription,
  });
}
