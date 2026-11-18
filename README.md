# Analizador

Client-side web app that estimates the chance that a CV, a portfolio website and a LinkedIn profile pass
(a) an ATS filter and (b) a recruiter's quick scan. It uses local, deterministic heuristics only: no AI,
no backend, no network calls at runtime. The UI is in Spanish.

## Run

```bash
npm install
npm run dev      # development server
npm run build    # type-check + production build into dist/
npm test         # unit tests (Vitest)
```

## Structure

- `src/analysis/` - pure domain (no DOM, no pdfjs): `cv/`, `portfolio/`, `linkedin/`, `shared/` (rule engine,
  scoring, keyword matching) and `overall.ts` (CV 50 %, LinkedIn 25 %, Portfolio 25 %, renormalized over the
  assets provided).
- `src/ui/` - DOM rendering and the PDF text-extraction adapter (`pdfjs-dist`).
- `src/main.ts` - wires the form to the analyzers.

Rules that cannot be evaluated (for example, keyword match without a job description, or HTML rules when only a
portfolio URL is given) are skipped and excluded from the score.

Browsers cannot fetch arbitrary sites (CORS), so for a full portfolio analysis the user pastes the page source.
