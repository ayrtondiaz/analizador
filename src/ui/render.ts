import type { AssetKey, OverallReport } from '../analysis/overall';
import type { AssetReport, RuleResult } from '../analysis/shared/types';

export const ASSET_TITLES: Record<AssetKey, string> = {
  cv: 'CV',
  portfolio: 'Portafolio',
  linkedin: 'LinkedIn',
};

const ASSET_ORDER: AssetKey[] = ['cv', 'linkedin', 'portfolio'];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function level(score: number): 'low' | 'mid' | 'high' {
  return score < 40 ? 'low' : score < 70 ? 'mid' : 'high';
}

function bar(score: number): HTMLElement {
  const track = el('div', 'bar');
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  track.setAttribute('aria-valuenow', String(score));
  const fill = el('div', `bar-fill ${level(score)}`);
  fill.style.width = `${score}%`;
  track.append(fill);
  return track;
}

function metric(label: string, score: number): HTMLElement {
  const box = el('div', 'metric');
  box.append(el('span', 'metric-label', label), el('strong', `metric-value ${level(score)}`, `${score} %`), bar(score));
  return box;
}

/** Failed rules first (heaviest first), then passed, then skipped. */
export function sortResults(results: readonly RuleResult[]): RuleResult[] {
  const rank = (r: RuleResult): number => (r.passed === false ? 0 : r.passed === true ? 1 : 2);
  return [...results].sort((a, b) => rank(a) - rank(b) || b.weight - a.weight);
}

function checklistItem(r: RuleResult): HTMLElement {
  const state = r.passed === true ? 'pass' : r.passed === false ? 'fail' : 'skip';
  const symbol = r.passed === true ? '✓' : r.passed === false ? '✗' : '—';
  const li = el('li', `check ${state}`);
  li.append(el('span', 'check-icon', symbol));
  const body = el('div', 'check-body');
  const title = el('div', 'check-title');
  title.append(
    el('span', undefined, r.label),
    el('span', 'tag', r.lens === 'ats' ? 'ATS' : 'Reclutador'),
  );
  body.append(title);
  if (r.passed === false) body.append(el('p', 'tip', r.tip));
  if (r.passed === null) body.append(el('p', 'muted', 'No evaluado: falta información para esta regla.'));
  li.append(body);
  return li;
}

function assetCard(key: AssetKey, report: AssetReport): HTMLElement {
  const card = el('article', 'card');
  card.append(el('h3', undefined, ASSET_TITLES[key]));
  const metrics = el('div', 'metrics');
  metrics.append(
    metric('ATS', report.atsScore),
    metric('Reclutador', report.recruiterScore),
    metric('Combinado', report.score),
  );
  card.append(metrics);
  const list = el('ul', 'checklist');
  for (const r of sortResults(report.results)) list.append(checklistItem(r));
  card.append(list);
  return card;
}

export function renderResults(
  container: HTMLElement,
  overall: OverallReport | null,
  reports: Partial<Record<AssetKey, AssetReport>>,
): void {
  container.replaceChildren();
  if (!overall) {
    container.append(el('p', 'muted', 'Agrega al menos un CV, un portafolio o un perfil de LinkedIn para analizar.'));
    return;
  }

  const hero = el('section', 'hero');
  hero.append(el('p', 'hero-label', 'Probabilidad global estimada'));
  hero.append(el('p', `hero-score ${level(overall.score)}`, `${overall.score} %`));
  hero.append(bar(overall.score));
  const split = el('p', 'muted', `Filtro ATS: ${overall.atsScore} %  ·  Revisión de reclutador: ${overall.recruiterScore} %`);
  hero.append(split);
  const weights = ASSET_ORDER.filter((k) => overall.weights[k] !== undefined)
    .map((k) => `${ASSET_TITLES[k]} ${Math.round((overall.weights[k] ?? 0) * 100)} %`)
    .join(' · ');
  hero.append(el('p', 'muted small', `Ponderación aplicada: ${weights}`));
  container.append(hero);

  for (const key of ASSET_ORDER) {
    const report = reports[key];
    if (report) container.append(assetCard(key, report));
  }

  container.append(
    el(
      'p',
      'disclaimer',
      'Esto es una estimación basada en reglas heurísticas locales; no es una garantía. Cada ATS y cada reclutador aplican criterios distintos.',
    ),
  );
}
