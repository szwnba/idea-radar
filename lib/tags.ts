import type { Signal } from './types';

/** 关键词规则打标签：命中即标，每条最多 3 个 */
const RULES: Array<{ tag: string; words: string[] }> = [
  {
    tag: 'AI',
    words: ['ai', 'llm', 'gpt', 'claude', 'gemini', 'deepseek', 'qwen', 'glm', 'agent', 'mcp', 'rag',
      '模型', '智能体', '大模型', '开源模型', 'fine-tune', 'embedding'],
  },
  {
    tag: '工具',
    words: ['tool', 'app', 'extension', 'plugin', 'cli', 'dashboard', 'template', 'boilerplate',
      '工具', '插件', '效率', '自动化', 'workflow'],
  },
  {
    tag: '变现',
    words: ['revenue', 'mrr', 'arr', 'income', 'pricing', 'paid', 'subscription', 'saas',
      '变现', '赚钱', '收入', '付费', '定价', '独立开发', 'indie', 'side project', '副业'],
  },
  {
    tag: '开源',
    words: ['open source', 'open-source', 'github.com', '开源', 'self-host', 'selfhost'],
  },
  {
    tag: '教程',
    words: ['how i', 'how to', 'guide', 'tutorial', 'build a', 'building', 'tutorial',
      '教程', '指南', '实战', '从零'],
  },
  {
    tag: '出海',
    words: ['global', 'international', 'overseas', '出海', '海外', '全球化'],
  },
  {
    tag: '趣味',
    words: ['fun', 'game', 'toy', 'playful', 'easter egg', '有趣', '游戏', '好玩', '彩蛋'],
  },
];

function normalize(text: string): string {
  return text.toLowerCase();
}

export function tagSignal(title: string, summary?: string): string[] {
  const hay = normalize(`${title} ${summary ?? ''}`);
  const hits: string[] = [];
  for (const { tag, words } of RULES) {
    if (hits.length >= 3) break;
    if (words.some((w) => hay.includes(normalize(w)))) hits.push(tag);
  }
  return hits;
}

export function applyTags(items: Signal[]): Signal[] {
  return items.map((it) => ({ ...it, tags: tagSignal(it.title, it.summary) }));
}

/** 近 N 天信号里出现最频繁的标签（底栏关键词用） */
export function topTags(items: Signal[], days = 7, limit = 8): Array<{ tag: string; count: number }> {
  const cutoff = Date.now() - days * 86_400_000;
  const counts = new Map<string, number>();
  for (const it of items) {
    if (new Date(it.publishedAt).getTime() < cutoff) continue;
    for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
