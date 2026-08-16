import { collectRss, rssSummary } from '../util/rss';
import type { Signal } from '../../lib/types';

/** Simon Willison 博客（LLM 小工具之王） */
export async function collect(): Promise<Signal[]> {
  return collectRss('https://simonwillison.net/atom/everything/', 'simonwillison', 10, (item) => ({
    channel: 'simonwillison' as const,
    title: item.title ?? '',
    url: item.link ?? '',
    summary: rssSummary(item),
    publishedAt: item.isoDate ?? new Date().toISOString(),
  }));
}
