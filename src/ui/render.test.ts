import { describe, expect, it } from 'vitest';
import type { RuleResult } from '../analysis/shared/types';
import { sortResults } from './render';

const r = (id: string, passed: boolean | null, weight: number): RuleResult => ({
  id,
  label: id,
  tip: '',
  lens: 'ats',
  passed,
  weight,
});

describe('sortResults', () => {
  it('lists failed rules first (heaviest first), then passed, then skipped', () => {
    const sorted = sortResults([
      r('skipped', null, 50),
      r('pass-heavy', true, 30),
      r('fail-light', false, 5),
      r('fail-heavy', false, 20),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(['fail-heavy', 'fail-light', 'pass-heavy', 'skipped']);
  });
});
