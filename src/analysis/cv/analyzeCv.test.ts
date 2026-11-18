import { describe, expect, it } from 'vitest';
import { GOOD_CV, GOOD_CV_ES, JOB_DESCRIPTION, WEAK_CV } from '../fixtures';
import { analyzeCv, detectDateFormats } from './analyzeCv';

const verdict = (text: string, id: string, jd?: string) =>
  analyzeCv(text, jd).results.find((r) => r.id === id)?.passed;

describe('analyzeCv', () => {
  it('scores a strong English CV well on both lenses', () => {
    const report = analyzeCv(GOOD_CV);
    expect(report.atsScore).toBeGreaterThanOrEqual(85);
    expect(report.recruiterScore).toBeGreaterThanOrEqual(85);
  });

  it('scores a strong Spanish CV (accents, ES headings and verbs)', () => {
    const report = analyzeCv(GOOD_CV_ES);
    for (const id of [
      'cv-email',
      'cv-phone',
      'cv-sections',
      'cv-dates',
      'cv-quantified',
      'cv-action-verbs',
      'cv-bullets',
    ]) {
      expect(report.results.find((r) => r.id === id)?.passed, id).toBe(true);
    }
  });

  it('scores a weak CV low and explains each failure with a tip', () => {
    const report = analyzeCv(WEAK_CV);
    expect(report.score).toBeLessThan(30);
    const failed = report.results.filter((r) => r.passed === false);
    expect(failed.length).toBeGreaterThan(5);
    expect(failed.every((r) => r.tip.length > 0)).toBe(true);
  });

  it('flags an image-based PDF (almost no extracted text) as unreadable by ATS', () => {
    const report = analyzeCv('Ana\n2021');
    expect(report.results.find((r) => r.id === 'cv-readable')?.passed).toBe(false);
    expect(report.atsScore).toBeLessThan(10);
  });

  it('penalizes CVs that are too short or too long', () => {
    expect(verdict('word '.repeat(100), 'cv-length')).toBe(false);
    expect(verdict('word '.repeat(1500), 'cv-length')).toBe(false);
    expect(verdict('word '.repeat(500), 'cv-length')).toBe(true);
  });

  it('detects first-person overuse', () => {
    expect(verdict('I did my work and I liked my job and my boss liked me. '.repeat(5), 'cv-first-person')).toBe(false);
    expect(verdict(GOOD_CV, 'cv-first-person')).toBe(true);
  });

  it('requires a phone number and does not mistake a year range for one', () => {
    expect(verdict('Contact: ana@example.com\nExperience 2019 - 2023', 'cv-phone')).toBe(false);
    expect(verdict('Tel: +54 9 387 555 1234', 'cv-phone')).toBe(true);
  });

  it('detects inconsistent date formats', () => {
    expect(detectDateFormats('Jan 2020 - 03/2021')).toEqual(expect.arrayContaining(['month-name', 'numeric']));
    expect(verdict('Jan 2020 - Mar 2021\n03/2019 - 12/2019', 'cv-dates')).toBe(false);
    expect(verdict('Jan 2020 - Mar 2021\nJun 2018 - Dec 2019', 'cv-dates')).toBe(true);
  });

  describe('job description matching', () => {
    it('skips the keyword rule (excluded from score) when no JD is given', () => {
      expect(verdict(GOOD_CV, 'cv-jd-keywords')).toBeNull();
    });

    it('passes when the CV covers the JD terms and fails when it does not', () => {
      expect(verdict(GOOD_CV, 'cv-jd-keywords', JOB_DESCRIPTION)).toBe(true);
      expect(verdict(GOOD_CV_ES, 'cv-jd-keywords', JOB_DESCRIPTION)).toBe(false);
    });

    it('does not change the score when the rule is skipped', () => {
      expect(analyzeCv(GOOD_CV, '   ').atsScore).toBe(analyzeCv(GOOD_CV).atsScore);
    });
  });
});
