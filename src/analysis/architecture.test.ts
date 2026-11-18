import { describe, expect, it } from 'vitest';

const sources = import.meta.glob(['./**/*.ts', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('domain purity', () => {
  it('analysis code does not use the DOM, pdfjs or the UI layer', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(5);
    for (const [file, code] of Object.entries(sources)) {
      expect(code, file).not.toMatch(/pdfjs|\bdocument\.|\bwindow\.|\.\.\/ui\//);
    }
  });
});
