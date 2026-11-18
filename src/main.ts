import './ui/styles.css';
import { analyzeCv } from './analysis/cv/analyzeCv';
import { analyzeLinkedIn } from './analysis/linkedin/analyzeLinkedIn';
import { computeOverall, type AssetReports } from './analysis/overall';
import { analyzePortfolio } from './analysis/portfolio/analyzePortfolio';
import { extractPdfText } from './ui/pdf';
import { renderResults } from './ui/render';

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
}

const jobDescription = byId<HTMLTextAreaElement>('job-description');
const cvText = byId<HTMLTextAreaElement>('cv-text');
const linkedinText = byId<HTMLTextAreaElement>('linkedin-text');
const portfolioUrl = byId<HTMLInputElement>('portfolio-url');
const portfolioHtml = byId<HTMLTextAreaElement>('portfolio-html');
const results = byId<HTMLElement>('results');

function wirePdfInput(inputId: string, target: HTMLTextAreaElement, statusId: string): void {
  const input = byId<HTMLInputElement>(inputId);
  const status = byId<HTMLElement>(statusId);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    status.textContent = 'Leyendo PDF…';
    try {
      const text = await extractPdfText(file);
      target.value = text;
      status.textContent =
        text.split(/\s+/).filter(Boolean).length < 50
          ? 'Se extrajo muy poco texto: el PDF podría ser una imagen. Un ATS tampoco podría leerlo.'
          : `Texto extraído (${text.length} caracteres). Puedes revisarlo y corregirlo abajo.`;
    } catch {
      status.textContent = 'No se pudo leer el PDF. Prueba con otro archivo o pega el texto manualmente.';
    }
  });
}

wirePdfInput('cv-file', cvText, 'cv-status');
wirePdfInput('linkedin-file', linkedinText, 'linkedin-status');

byId<HTMLFormElement>('analyzer-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const jd = jobDescription.value.trim() || undefined;
  const reports: AssetReports = {};

  if (cvText.value.trim()) reports.cv = analyzeCv(cvText.value, jd);
  if (linkedinText.value.trim()) reports.linkedin = analyzeLinkedIn(linkedinText.value, jd);
  if (portfolioUrl.value.trim() || portfolioHtml.value.trim()) {
    reports.portfolio = analyzePortfolio({ url: portfolioUrl.value, html: portfolioHtml.value }, jd);
  }

  renderResults(results, computeOverall(reports), reports);
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
