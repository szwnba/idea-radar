import { collectRss, rssSummary } from '../util/rss';
import type { Signal } from '../../lib/types';

/** Reddit r/SideProject（数据中心 IP 可能被拒，尽力抓取） */
export async function collect(): Promise<Signal[]> {
  return collectRss('https://www.reddit.com/r/SideProject/.rss', 'reddit', 15, (item) => ({
    channel: 'reddit' as const,
    title: (item.title ?? '').replace(/^\/?r\/SideProject:\s*/, ''),
    url: item.link ?? '',
    summary: rssSummary(item),
    author: item.creator,
    publishedAt: item.isoDate ?? new Date().toISOString(),
  }));
}
