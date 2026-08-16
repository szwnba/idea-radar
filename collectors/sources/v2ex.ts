import { fetchJson, signalId } from '../util/http';
import type { Signal } from '../../lib/types';

interface V2Topic {
  id: number;
  title: string;
  url: string;
  content: string;
  member?: { username: string };
  replies: number;
  created: number; // epoch seconds
}

/** V2EX「分享创造」节点（官方 API，可能被墙，尽力抓取） */
export async function collect(): Promise<Signal[]> {
  const topics = await fetchJson<V2Topic[]>(
    'https://www.v2ex.com/api/topics/show.json?node_name=create',
  );
  const now = new Date().toISOString();

  return topics.map((t) => ({
    id: signalId(t.url),
    channel: 'v2ex' as const,
    title: t.title,
    url: t.url,
    summary: t.content?.slice(0, 160).trim() || undefined,
    author: t.member?.username,
    points: t.replies, // 用回复数当互动量
    comments: t.replies,
    publishedAt: new Date(t.created * 1000).toISOString(),
    collectedAt: now,
    heat: 0,
    tags: [],
  }));
}
