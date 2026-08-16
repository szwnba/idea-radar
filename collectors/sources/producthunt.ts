import { collectRss, rssSummary } from '../util/rss';
import type { Signal } from '../../lib/types';

/** Product Hunt 官方 Atom feed（无需 OAuth） */
export async function collect(): Promise<Signal[]> {
  return collectRss('https://www.producthunt.com/feed', 'producthunt', 15, (item) => ({
    channel: 'producthunt',
    title: item.title ?? '',
    url: item.link ?? '',
    summary: rssSummary(item),
    author: item.creator,
    publishedAt: item.isoDate ?? new Date().toISOString(),
  }));
}
