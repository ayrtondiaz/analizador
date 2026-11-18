import { describe, expect, it } from 'vitest';
import { buildReport, lensScore } from './scoring';
import type { RuleResult } from './types';

const r = (lens: 'ats' | 'recruiter', weight: number, passed: boolean | null): RuleResult => ({
  id: `${lens}-${weight}-${passed}`,
  label: '',
  tip: '',
  lens,
  weight,
  passed,
});

describe('lensScore', () => {
  it('computes a weighted percentage of passed rules', () => {
    expect(lensScore([r('ats', 30, true), r('ats', 10, false)], 'ats')).toBe(75);
  });

  it('excludes skipped rules from the denominator', () => {
    expect(lensScore([r('ats', 10, true), r('ats', 90, null)], 'ats')).toBe(100);
  });

  it('only counts rules of the requested lens', () => {
    expect(lensScore([r('ats', 10, true), r('recruiter', 10, false)], 'recruiter')).toBe(0);
  });
});

describe('buildReport', () => {
  it('averages both lenses into the combined score', () => {
    const report = buildReport([r('ats', 10, true), r('recruiter', 10, false)]);
    expect(report).toMatchObject({ atsScore: 100, recruiterScore: 0, score: 50 });
  });
});
