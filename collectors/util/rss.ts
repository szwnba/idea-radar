import Parser from 'rss-parser';
import { fetchText, signalId, sleep, stripHtml } from './http';
import type { Signal } from '../../lib/types';

const parser = new Parser({
  timeout: 20_000,
  headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 IdeaRadar/1.0' },
  customFields: { item: [['content:encoded', 'contentEncoded']] },
});

export interface RssItemInput {
  channel: Signal['channel'];
  title: string;
  url: string;
  summary?: string;
  author?: string;
  points?: number;
  comments?: number;
  publishedAt: string;
}

function pickLink(item: Parser.Item): string {
  const links = (item as Parser.Item & { links?: Array<{ rel?: string; href?: string }> }).links;
  return item.link ?? links?.find((l) => !l.rel || l.rel === 'alternate')?.href ?? '';
}

/** 通用 RSS/Atom 抓取：fetchText 拿原始 XML 再交给 rss-parser（带重试） */
export async function collectRss(
  url: string,
  channel: Signal['channel'],
  limit: number,
  mapItem: (item: Parser.Item) => RssItemInput | null,
): Promise<Signal[]> {
  let xml = '';
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      xml = await fetchText(url, 20_000);
      break;
    } catch (err) {
      lastErr = err;
      await sleep(2_000);
    }
  }
  if (!xml) throw lastErr ?? new Error(`fetch failed: ${url}`);

  const feed = await parser.parseString(xml);
  const now = new Date().toISOString();
  const signals: Signal[] = [];

  for (const item of (feed.items ?? []).slice(0, limit)) {
    const mapped = mapItem(item);
    if (!mapped?.title || !mapped.url) continue;
    signals.push({
      id: signalId(mapped.url),
      channel,
      title: mapped.title.trim(),
      url: mapped.url.trim(),
      summary: mapped.summary,
      author: mapped.author,
      points: mapped.points ?? 0,
      comments: mapped.comments ?? 0,
      publishedAt: mapped.publishedAt,
      collectedAt: now,
      heat: 0,
      tags: [],
    });
  }
  return signals;
}

export function rssSummary(item: Parser.Item, max = 180): string | undefined {
  const raw = item.contentSnippet
    ?? (item as Parser.Item & { contentEncoded?: string }).contentEncoded
    ?? item.content
    ?? item.summary
    ?? '';
  const text = stripHtml(String(raw), max);
  return text || undefined;
}

export { pickLink };
