import type { AssetReport } from './shared/types';

export const ASSET_WEIGHTS = { cv: 0.5, linkedin: 0.25, portfolio: 0.25 } as const;

export type AssetKey = keyof typeof ASSET_WEIGHTS;
export type AssetReports = Partial<Record<AssetKey, AssetReport>>;

export interface OverallReport {
  atsScore: number;
  recruiterScore: number;
  score: number;
  /** Effective weights after renormalizing over provided assets (sum = 1). */
  weights: Partial<Record<AssetKey, number>>;
}

/** Weighted global score; returns null when no asset was provided. */
export function computeOverall(reports: AssetReports): OverallReport | null {
  const keys = (Object.keys(ASSET_WEIGHTS) as AssetKey[]).filter((k) => reports[k]);
  if (keys.length === 0) return null;
  const totalWeight = keys.reduce((sum, k) => sum + ASSET_WEIGHTS[k], 0);
  const weights: Partial<Record<AssetKey, number>> = {};
  let ats = 0;
  let recruiter = 0;
  let score = 0;
  for (const k of keys) {
    const w = ASSET_WEIGHTS[k] / totalWeight;
    const r = reports[k] as AssetReport;
    weights[k] = w;
    ats += r.atsScore * w;
    recruiter += r.recruiterScore * w;
    score += r.score * w;
  }
  return {
    atsScore: Math.round(ats),
    recruiterScore: Math.round(recruiter),
    score: Math.round(score),
    weights,
  };
}
