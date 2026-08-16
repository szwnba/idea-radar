import { fetchJson, mapLimit, signalId } from '../util/http';
import type { Signal } from '../../lib/types';

interface HNItem {
  id: number;
  title?: string;
  url?: string;
  by?: string;
  score?: number;
  descendants?: number;
  time?: number; // epoch seconds
  type?: string;
  dead?: boolean;
}

/**
 * Hacker News：首页 topstories + newstories，
 * 保留 Show HN / Ask HN 及高分公司贴，过滤日常新闻噪音。
 */
export async function collect(): Promise<Signal[]> {
  const [top, fresh] = await Promise.all([
    fetchJson<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json'),
    fetchJson<number[]>('https://hacker-news.firebaseio.com/v0/newstories.json'),
  ]);

  const ids = [...new Set([...top.slice(0, 50), ...fresh.slice(0, 80)])];
  const items = (
    await mapLimit(ids, 8, async (id) => {
      try {
        return await fetchJson<HNItem>(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          8_000,
          1,
        );
      } catch {
        return null;
      }
    })
  ).filter((x): x is HNItem => Boolean(x?.title && x.time && x.type === 'story' && !x.dead));

  const now = new Date().toISOString();
  const kept = items.filter((it) => {
    const t = (it.title ?? '').toLowerCase();
    if (t.startsWith('show hn') || t.startsWith('ask hn')) return true;
    return (it.score ?? 0) >= 120; // 高分帖才有信号价值
  });

  return kept.map((it) => ({
    id: signalId(it.url ?? `https://news.ycombinator.com/item?id=${it.id}`),
    channel: 'hn' as const,
    title: it.title ?? '',
    url: it.url ?? `https://news.ycombinator.com/item?id=${it.id}`,
    author: it.by,
    points: it.score ?? 0,
    comments: it.descendants ?? 0,
    publishedAt: new Date((it.time ?? 0) * 1000).toISOString(),
    collectedAt: now,
    heat: 0,
    tags: [],
  }));
}
