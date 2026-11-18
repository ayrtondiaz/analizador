# Feature: analyzer-mvp

## Objective
Local web app that estimates the % chance of passing an ATS filter and a recruiter scan for three assets: CV, portfolio website, LinkedIn profile.

## Problem / Why
Candidates don't know how their CV, portfolio and LinkedIn perform against automated filters and human recruiters before applying.

## Scope
- 100% client-side, deterministic heuristics (no AI, no backend) — user decision 2026-11-18.
- Inputs: CV (PDF upload or pasted text), portfolio (URL + pasted HTML source), LinkedIn (profile "Save to PDF" or pasted text), optional job description for keyword match.
- Output per asset: ATS score, recruiter score, combined %, checklist of passed/failed rules with actionable tips. Global weighted %.

## Constraints
- Stack: Vite + TypeScript (vanilla, no framework), Vitest, pdfjs-dist for PDF text extraction.
- Screaming architecture: pure domain scorers isolated from UI.
- Code, UI copy and comments in English unless the user asks otherwise.
- TDD: disabled (no project config); ordinary functional checks apply. Runner: `npx vitest run`.

## Tasks
- [x] T1 — Scaffold + domain scorers (cv, portfolio, linkedin, keywords) with unit tests. Route: delegated direct (writer trigger: 2+ non-trivial files).
- [x] T2 — UI: inputs, PDF extraction, results rendering. Route: delegated direct (same writer).

## Acceptance criteria
- `npm run build` succeeds; `npx vitest run` green.
- Each asset yields scores 0–100 and a rule checklist with tips.
- Works without network once installed.

## Checks
- `npm run build`, `npx vitest run`, `npx tsc --noEmit`.

## Delivery
- Strategy: ask-on-risk. Forecast > 400 authored lines (new app); single local repo, no remote — no PRs planned.

## Progress
- Repo initialized, branch `feat/analyzer-mvp`.
- T1 done, commit `87a8df0` (feat(analysis)): scorers for cv/portfolio/linkedin, shared rule engine, keywords, overall. Route: delegated direct (single writer).
- T2 done, commit `3cddcf5` (feat(ui)): form, pdfjs adapter, results rendering, styles, README.
- Verification (observed, final tree): `npm install` ok (0 vulnerabilities); `npx tsc --noEmit` clean; `npx vitest run` 8 files / 47 tests passed; `npm run build` succeeded (dist/ built).
- Not verified: manual in-browser run with a real PDF (pdfjs worker) - only build-time checks.
- Next: manual browser smoke test; tune rule weights with real CVs.
