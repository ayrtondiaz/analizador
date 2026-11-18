import { describe, expect, it } from 'vitest';
import { GOOD_LINKEDIN, JOB_DESCRIPTION, WEAK_LINKEDIN } from '../fixtures';
import { analyzeLinkedIn, isRandomSlug } from './analyzeLinkedIn';
import { extractHeadline, parseProfile } from './sections';

const verdict = (text: string, id: string, jd?: string) =>
  analyzeLinkedIn(text, jd).results.find((r) => r.id === id)?.passed;

describe('analyzeLinkedIn', () => {
  it('scores a complete profile highly', () => {
    const report = analyzeLinkedIn(GOOD_LINKEDIN);
    expect(report.atsScore).toBeGreaterThanOrEqual(85);
    expect(report.recruiterScore).toBeGreaterThanOrEqual(85);
  });

  it('scores a weak profile low', () => {
    const report = analyzeLinkedIn(WEAK_LINKEDIN);
    expect(report.score).toBeLessThan(30);
    expect(verdict(WEAK_LINKEDIN, 'li-headline')).toBe(false);
    expect(verdict(WEAK_LINKEDIN, 'li-about')).toBe(false);
  });

  it('rejects generic headlines and accepts role + keywords', () => {
    expect(verdict('Ana\nLooking for opportunities\nSalta\nExperience\nx', 'li-headline')).toBe(false);
    expect(verdict('Headline: Data Engineer | Python · SQL · Airflow', 'li-headline')).toBe(true);
    expect(verdict('Titular: Estudiante', 'li-headline')).toBe(false);
  });

  it('requires 100 words in About (Spanish heading "Extracto" supported)', () => {
    expect(verdict('Ana\nDev\nExtracto\n' + 'palabra '.repeat(120), 'li-about')).toBe(true);
    expect(verdict('Ana\nDev\nExtracto\n' + 'palabra '.repeat(20), 'li-about')).toBe(false);
  });

  it('skips the skills rule when a PDF export only lists the top 3 skills', () => {
    expect(verdict('Top Skills\nReact\nNode\nSQL\nAna Perez\nDeveloper\nBA\nExperience\nx', 'li-skills')).toBeNull();
    expect(verdict(GOOD_LINKEDIN, 'li-skills')).toBe(true);
    expect(verdict('Skills\nReact\nNode', 'li-skills')).toBe(false);
  });

  it('flags random numbers in the custom URL and skips when no URL is present', () => {
    expect(verdict('linkedin.com/in/ana-perez-a1b2c3d4', 'li-custom-url')).toBe(false);
    expect(verdict('www.linkedin.com/in/ana-perez-123456789 (LinkedIn)', 'li-custom-url')).toBe(false);
    expect(verdict('www.linkedin.com/in/ana-perez', 'li-custom-url')).toBe(true);
    expect(verdict('no url here', 'li-custom-url')).toBeNull();
  });

  it('detects certifications and recommendations bonuses in ES and EN', () => {
    expect(verdict('Licencias y certificaciones\nAWS CCP', 'li-certifications')).toBe(true);
    expect(verdict('Recomendaciones\nRecibidas 2', 'li-recommendations')).toBe(true);
    expect(verdict(WEAK_LINKEDIN, 'li-certifications')).toBe(false);
  });

  it('matches job description keywords, or skips without one', () => {
    expect(verdict(GOOD_LINKEDIN, 'li-jd-keywords')).toBeNull();
    expect(verdict(GOOD_LINKEDIN, 'li-jd-keywords', JOB_DESCRIPTION)).toBe(true);
    expect(verdict(WEAK_LINKEDIN, 'li-jd-keywords', JOB_DESCRIPTION)).toBe(false);
  });
});

describe('profile parsing', () => {
  it('extracts the headline from the PDF-export preamble (name, headline, location)', () => {
    const profile = parseProfile(GOOD_LINKEDIN);
    expect(extractHeadline(profile, GOOD_LINKEDIN)).toContain('Senior Frontend Developer');
  });

  it('isRandomSlug', () => {
    expect(isRandomSlug('ana-perez')).toBe(false);
    expect(isRandomSlug('ana-perez-5a3b12')).toBe(true);
    expect(isRandomSlug('anaperez1990')).toBe(true);
  });
});
