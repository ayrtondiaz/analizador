/**
 * Minimal regex-based HTML inspection. The domain layer must not depend on the DOM,
 * so pasted page sources are examined as plain text.
 */

export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

export function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<head\b[\s\S]*?<\/head>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|section|article|br|tr)>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

export function getTitle(html: string): string {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities((m[1] ?? '').replace(/\s+/g, ' ').trim()) : '';
}

export function getAttr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!m) return null;
  return decodeEntities(m[1] ?? m[2] ?? m[3] ?? '');
}

export function getTags(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

export function getMetaContent(html: string, metaName: string): string {
  for (const tag of getTags(html, 'meta')) {
    if ((getAttr(tag, 'name') ?? '').toLowerCase() === metaName) {
      return (getAttr(tag, 'content') ?? '').trim();
    }
  }
  return '';
}

export function getHrefs(html: string): string[] {
  return getTags(html, 'a')
    .map((tag) => getAttr(tag, 'href'))
    .filter((h): h is string => !!h);
}
