import { describe, expect, it } from 'vitest';
import { computeOverall } from './overall';
import type { AssetReport } from './shared/types';

const report = (score: number): AssetReport => ({
  atsScore: score,
  recruiterScore: score,
  score,
  results: [],
});

describe('computeOverall', () => {
  it('returns null when nothing was provided', () => {
    expect(computeOverall({})).toBeNull();
  });

  it('weights CV 50%, LinkedIn 25% and Portfolio 25%', () => {
    const overall = computeOverall({ cv: report(100), linkedin: report(0), portfolio: report(0) });
    expect(overall?.score).toBe(50);
  });

  it('renormalizes over the assets actually provided', () => {
    const overall = computeOverall({ cv: report(80), linkedin: report(20) });
    expect(overall?.score).toBe(60);
    expect(overall?.weights.cv).toBeCloseTo(2 / 3);
    expect(overall?.weights.portfolio).toBeUndefined();
  });

  it('a single asset equals the global score', () => {
    expect(computeOverall({ portfolio: report(42) })?.score).toBe(42);
  });
});
