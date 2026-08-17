import { signalId } from '../util/http';
import type { Signal } from '../../lib/types';

/** 走 contents API 而非 raw CDN：raw 域名对部分 IP 限流（429） */
const README_API =
  'https://api.github.com/repos/XiaomingX/1000-chinese-independent-developer-plus/contents/README.md';

async function fetchReadme(): Promise<string> {
  const res = await fetch(README_API, {
    headers: {
      accept: 'application/vnd.github.raw+json',
      'user-agent': 'IdeaRadar/1.0',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** 表格行 → 单元格数组 */
function cells(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
}

function stripMd(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').trim();
}

/**
 * 千人独立开发者项目库：解析主 README 的精选项目表。
 * 项目无发布时间，以「首次进入雷达」为信号时间（run.ts 合并时保留首见时间）；
 * 维护者新增项目后，下一轮巡扫即成为新信号。
 */
export async function collect(): Promise<Signal[]> {
  const md = await fetchReadme();
  const now = new Date().toISOString();
  const signals: Signal[] = [];

  for (const line of md.split('\n')) {
    if (!line.startsWith('|') || /^\|\s*-{2,}/.test(line)) continue;
    const cols = cells(line);
    if (cols.length < 5) continue;

    const [category, developer, name, linkCell, summary] = cols;
    const linkMatch = linkCell.match(/\((https?:\/\/[^)]+)\)/);
    const url = linkMatch?.[1] ?? (/^https?:\/\//.test(linkCell) ? linkCell : '');
    if (!url || !name) continue;

    signals.push({
      id: signalId(url),
      channel: 'indie1000',
      title: stripMd(name),
      url,
      summary: summary ? `【${stripMd(category)}】${stripMd(summary)}` : `【${stripMd(category)}】`,
      author: stripMd(developer) || undefined,
      points: 0,
      comments: 0,
      publishedAt: now,
      collectedAt: now,
      heat: 0,
      tags: [],
    });
  }

  return signals;
}
