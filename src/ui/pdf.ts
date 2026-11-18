import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

/** Extracts plain text from a PDF file in the browser, keeping line breaks. */
export async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const pdf = await task.promise;
  const pages: string[] = [];
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      let out = '';
      let lastY: number | null = null;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const y = item.transform[5] as number;
        if (lastY !== null && Math.abs(y - lastY) > 2 && !out.endsWith('\n')) out += '\n';
        out += item.str;
        if (item.hasEOL) out += '\n';
        lastY = y;
      }
      pages.push(out);
    }
  } finally {
    await task.destroy();
  }
  return pages.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
