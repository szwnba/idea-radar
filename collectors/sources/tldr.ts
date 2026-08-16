import { collectRss, rssSummary } from '../util/rss';
import type { Signal } from '../../lib/types';

/** TLDR AI 日报 */
export async function collect(): Promise<Signal[]> {
  return collectRss('https://tldr.tech/api/rss/ai', 'tldr', 4, (item) => ({
    channel: 'tldr' as const,
    title: item.title ?? '',
    url: item.link ?? '',
    summary: rssSummary(item, 260),
    publishedAt: item.isoDate ?? new Date().toISOString(),
  }));
}
