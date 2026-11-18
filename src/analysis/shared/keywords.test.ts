import { describe, expect, it } from 'vitest';
import { extractKeywords, keywordVerdict, matchKeywords } from './keywords';
import { normalize } from './text';

describe('normalize', () => {
  it('removes accents and lowercases', () => {
    expect(normalize('Educación Y FORMACIÓN')).toBe('educacion y formacion');
  });
});

describe('extractKeywords', () => {
  it('returns the most frequent meaningful terms and drops EN and ES stopwords', () => {
    const jd =
      'We need React and React experts. Buscamos desarrolladores con experiencia en React y TypeScript. TypeScript is a plus.';
    const keywords = extractKeywords(jd);
    expect(keywords[0]).toBe('react');
    expect(keywords[1]).toBe('typescript');
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('con');
    expect(keywords).not.toContain('experiencia');
  });

  it('respects topN', () => {
    expect(extractKeywords('alpha beta gamma delta epsilon', 3)).toHaveLength(3);
  });

  it('ignores plain numbers and keeps tech tokens like c++ and node.js', () => {
    const keywords = extractKeywords('C++ and Node.js for 5 years 2024');
    expect(keywords).toContain('c++');
    expect(keywords).toContain('node.js');
    expect(keywords).not.toContain('2024');
  });
});

describe('matchKeywords', () => {
  it('matches ignoring accents and case', () => {
    const result = matchKeywords('Experto en OPTIMIZACIÓN y Gestión', ['optimizacion', 'gestion', 'python']);
    expect(result.matched).toEqual(['optimizacion', 'gestion']);
    expect(result.missing).toEqual(['python']);
    expect(result.ratio).toBeCloseTo(2 / 3);
  });
});

describe('keywordVerdict', () => {
  it('is skipped (null) without a job description', () => {
    expect(keywordVerdict('anything')).toBeNull();
    expect(keywordVerdict('anything', '   ')).toBeNull();
  });

  it('passes at 60% or more and fails below', () => {
    const jd = 'react typescript node docker kubernetes';
    expect(keywordVerdict('react typescript node', jd)).toBe(true);
    expect(keywordVerdict('react typescript', jd)).toBe(false);
  });
});
