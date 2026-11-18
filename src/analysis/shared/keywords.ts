import { STOPWORDS } from './stopwords';
import { tokenize } from './text';
import type { Rule } from './types';

export const KEYWORD_MATCH_THRESHOLD = 0.6;

/** Top-N most frequent meaningful terms of a job description (ties keep first-seen order). */
export function extractKeywords(jobDescription: string, topN = 20): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(jobDescription)) {
    if (token.length < 2 || STOPWORDS.has(token) || /^\d+$/.test(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([term, count], index) => ({ term, count, index }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .slice(0, topN)
    .map((e) => e.term);
}

export interface KeywordMatch {
  keywords: string[];
  matched: string[];
  missing: string[];
  /** 0-1. */
  ratio: number;
}

export function matchKeywords(text: string, keywords: readonly string[]): KeywordMatch {
  const tokens = new Set(tokenize(text));
  const matched = keywords.filter((k) => tokens.has(k));
  const missing = keywords.filter((k) => !tokens.has(k));
  return {
    keywords: [...keywords],
    matched,
    missing,
    ratio: keywords.length === 0 ? 0 : matched.length / keywords.length,
  };
}

/** Returns null (skipped) when there is no usable job description. */
export function keywordVerdict(text: string, jobDescription?: string): boolean | null {
  if (!jobDescription || jobDescription.trim() === '') return null;
  const keywords = extractKeywords(jobDescription);
  if (keywords.length === 0) return null;
  return matchKeywords(text, keywords).ratio >= KEYWORD_MATCH_THRESHOLD;
}

export interface HasJobDescription {
  text: string;
  jobDescription?: string;
}

export function keywordRule<Ctx extends HasJobDescription>(id: string, weight: number): Rule<Ctx> {
  return {
    id,
    label: 'Coincidencia con las palabras clave de la oferta (≥ 60 %)',
    weight,
    lens: 'ats',
    tip: 'Incorpora de forma natural los términos más repetidos en la oferta (tecnologías, herramientas, cargos), usando las mismas palabras que ella.',
    check: (ctx) => keywordVerdict(ctx.text, ctx.jobDescription),
  };
}
