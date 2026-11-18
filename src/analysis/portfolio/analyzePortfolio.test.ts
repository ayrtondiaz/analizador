import { describe, expect, it } from 'vitest';
import { GOOD_PORTFOLIO_HTML, WEAK_PORTFOLIO_HTML } from '../fixtures';
import { analyzePortfolio, countProjects } from './analyzePortfolio';

const verdict = (report: ReturnType<typeof analyzePortfolio>, id: string) =>
  report.results.find((r) => r.id === id)?.passed;

describe('analyzePortfolio', () => {
  it('scores a well-built portfolio highly', () => {
    const report = analyzePortfolio({ url: 'https://anaperez.dev', html: GOOD_PORTFOLIO_HTML });
    expect(report.atsScore).toBeGreaterThanOrEqual(90);
    expect(report.recruiterScore).toBeGreaterThanOrEqual(90);
  });

  it('scores a weak portfolio low and reports specific failures', () => {
    const report = analyzePortfolio({ url: 'http://me.wixsite.com/x', html: WEAK_PORTFOLIO_HTML });
    expect(report.score).toBeLessThan(25);
    for (const id of ['pf-https', 'pf-custom-domain', 'pf-title', 'pf-img-alt', 'pf-projects']) {
      expect(verdict(report, id), id).toBe(false);
    }
  });

  it('with only a URL, evaluates URL rules and skips HTML rules', () => {
    const report = analyzePortfolio({ url: 'https://anaperez.dev' });
    expect(verdict(report, 'pf-https')).toBe(true);
    expect(verdict(report, 'pf-custom-domain')).toBe(true);
    for (const id of ['pf-title', 'pf-meta-description', 'pf-viewport', 'pf-projects', 'pf-contact', 'pf-jd-keywords']) {
      expect(verdict(report, id), id).toBeNull();
    }
    expect(report.atsScore).toBe(100);
  });

  it('skips the image rule when the page has no images', () => {
    const report = analyzePortfolio({ url: 'https://a.dev', html: '<html><title>Ana Perez Dev</title><p>hi</p></html>' });
    expect(verdict(report, 'pf-img-alt')).toBeNull();
  });

  it('flags HTML that is too large', () => {
    const report = analyzePortfolio({ url: 'https://a.dev', html: '<p>' + 'x'.repeat(600_000) + '</p>' });
    expect(verdict(report, 'pf-size')).toBe(false);
  });

  it('matches job description keywords against the visible text only', () => {
    const jd = 'react typescript accessibility';
    expect(verdict(analyzePortfolio({ url: 'https://a.dev', html: GOOD_PORTFOLIO_HTML }, jd), 'pf-jd-keywords')).toBe(true);
    const hiddenOnly = analyzePortfolio(
      {
        url: 'https://a.dev',
        html: '<html><head><title>react typescript accessibility</title></head><body><p>hello</p></body></html>',
      },
      jd,
    );
    expect(verdict(hiddenOnly, 'pf-jd-keywords')).toBe(false);
    expect(verdict(analyzePortfolio({ url: 'https://a.dev', html: GOOD_PORTFOLIO_HTML }), 'pf-jd-keywords')).toBeNull();
  });
});

describe('countProjects', () => {
  it('counts articles', () => {
    expect(countProjects('<article></article><article></article>')).toBe(2);
  });

  it('counts headings under a projects heading in either language', () => {
    const html = '<h2>Proyectos</h2><h3>A</h3><h3>B</h3><h3>C</h3><h2>Contacto</h2><h3>X</h3>';
    expect(countProjects(html)).toBe(3);
  });

  it('counts project cards by class', () => {
    const html = '<div class="project-card"></div><div class="project-card"></div><div class="project-card"></div>';
    expect(countProjects(html)).toBeGreaterThanOrEqual(3);
  });
});
