export type Lens = 'ats' | 'recruiter';

/** Outcome of a rule: true = passed, false = failed, null = could not be evaluated. */
export type Verdict = boolean | null;

export interface Rule<Ctx> {
  id: string;
  label: string;
  weight: number;
  lens: Lens;
  /** Actionable advice shown when the rule fails. */
  tip: string;
  check: (ctx: Ctx) => Verdict;
}

export interface RuleResult {
  id: string;
  label: string;
  passed: Verdict;
  weight: number;
  tip: string;
  lens: Lens;
}

export interface AssetReport {
  /** 0-100 chance of passing an automated ATS filter. */
  atsScore: number;
  /** 0-100 chance of passing a human recruiter's quick scan. */
  recruiterScore: number;
  /** Average of both lenses, 0-100. */
  score: number;
  results: RuleResult[];
}
