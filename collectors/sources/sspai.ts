import { collectRss, rssSummary } from '../util/rss';
import type { Signal } from '../../lib/types';

/** 少数派（效率工具中文风向标） */
export async function collect(): Promise<Signal[]> {
  return collectRss('https://sspai.com/feed', 'sspai', 12, (item) => ({
    channel: 'sspai' as const,
    title: item.title ?? '',
    url: item.link ?? '',
    summary: rssSummary(item),
    publishedAt: item.isoDate ?? new Date().toISOString(),
  }));
}
