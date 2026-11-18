import type { AssetReport, Lens, Rule, RuleResult } from './types';

export function runRules<Ctx>(rules: readonly Rule<Ctx>[], ctx: Ctx): RuleResult[] {
  return rules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.check(ctx),
    weight: rule.weight,
    tip: rule.tip,
    lens: rule.lens,
  }));
}

/** Weighted percentage of passed rules for one lens; skipped rules are excluded. */
export function lensScore(results: readonly RuleResult[], lens: Lens): number {
  let total = 0;
  let earned = 0;
  for (const r of results) {
    if (r.lens !== lens || r.passed === null) continue;
    total += r.weight;
    if (r.passed) earned += r.weight;
  }
  return total === 0 ? 0 : Math.round((earned / total) * 100);
}

export function buildReport(results: RuleResult[]): AssetReport {
  const atsScore = lensScore(results, 'ats');
  const recruiterScore = lensScore(results, 'recruiter');
  return {
    atsScore,
    recruiterScore,
    score: Math.round((atsScore + recruiterScore) / 2),
    results,
  };
}

export function evaluate<Ctx>(rules: readonly Rule<Ctx>[], ctx: Ctx): AssetReport {
  return buildReport(runRules(rules, ctx));
}
