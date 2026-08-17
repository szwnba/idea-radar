import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CHANNEL_MAP } from '../lib/channels';
import { applyTags } from '../lib/tags';
import { computeHeat } from '../lib/score';
import type { ChannelId, ChannelStatus, DayStat, Signal, SyncMeta } from '../lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const MAX_ITEMS = 2000;
const SOURCE_TIMEOUT_MS = 60_000;

import * as hackernews from './sources/hackernews';
import * as github from './sources/github';
import * as producthunt from './sources/producthunt';
import * as tldr from './sources/tldr';
import * as simonwillison from './sources/simonwillison';
import * as ruanyf from './sources/ruanyf';
import * as indie1000 from './sources/indie1000';
import * as huggingface from './sources/huggingface';
import * as sspai from './sources/sspai';
import * as reddit from './sources/reddit';
import * as v2ex from './sources/v2ex';

type Collector = { id: ChannelId; collect: () => Promise<Signal[]> };

const collectors: Collector[] = [
  { id: 'hn', collect: hackernews.collect },
  { id: 'github', collect: github.collect },
  { id: 'producthunt', collect: producthunt.collect },
  { id: 'tldr', collect: tldr.collect },
  { id: 'simonwillison', collect: simonwillison.collect },
  { id: 'ruanyf', collect: ruanyf.collect },
  { id: 'indie1000', collect: indie1000.collect },
  { id: 'huggingface', collect: huggingface.collect },
  { id: 'sspai', collect: sspai.collect },
  { id: 'reddit', collect: reddit.collect },
  { id: 'v2ex', collect: v2ex.collect },
];

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 超时 (${ms / 1000}s)`)), ms),
    ),
  ]);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.join(DATA_DIR, file), 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

async function main() {
  const startedAt = Date.now();
  await mkdir(DATA_DIR, { recursive: true });

  const existing = await readJson<Signal[]>('items.json', []);
  const byId = new Map(existing.map((s) => [s.id, s]));
  const before = byId.size;

  const active = collectors.filter(({ id }) => CHANNEL_MAP[id].enabled !== false);
  const disabled = collectors.length - active.length;
  console.log(`▶ 开始扫描 ${active.length}/${collectors.length} 个频道${disabled ? `（${disabled} 个已禁用）` : ''}…\n`);

  const statuses: ChannelStatus[] = [];
  const results = await Promise.allSettled(
    active.map(({ id, collect }) => withTimeout(collect(), SOURCE_TIMEOUT_MS, id)),
  );

  for (let i = 0; i < active.length; i++) {
    const { id } = active[i];
    const result = results[i];
    if (result.status === 'fulfilled') {
      const fresh = result.value;
      let replaced = 0;
      for (const s of fresh) {
        const old = byId.get(s.id);
        if (old) replaced++;
        // 保留首见时间：无原始发布时间的源（trending/千人库）不会每轮被“保鲜”
        byId.set(s.id, old ? { ...s, publishedAt: old.publishedAt } : s);
      }
      statuses.push({ channel: id, ok: true, count: fresh.length });
      console.log(`  ● ${id.padEnd(14)} ${String(fresh.length).padStart(3)} 条${replaced ? `（${replaced} 更新）` : '（新增）'}`);
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      statuses.push({ channel: id, ok: false, count: 0, error: reason.slice(0, 120) });
      console.log(`  ○ ${id.padEnd(14)} 中断 — ${reason.slice(0, 80)}`);
    }
  }

  // 标签 → 热度（全量重算，旧信号自然冷却）→ 滚动裁剪 → 落盘
  let items = applyTags([...byId.values()]);
  items = computeHeat(items);
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  items = items.slice(0, MAX_ITEMS);

  const meta: SyncMeta = {
    lastSync: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    sources: statuses,
  };

  const dayCounts = new Map<string, number>();
  for (const it of items) {
    const day = it.publishedAt.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }
  const stats: DayStat[] = [...dayCounts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  await Promise.all([
    writeFile(path.join(DATA_DIR, 'items.json'), `${JSON.stringify(items, null, 2)}\n`),
    writeFile(path.join(DATA_DIR, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`),
    writeFile(path.join(DATA_DIR, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`),
  ]);

  const okCount = statuses.filter((s) => s.ok).length;
  const newCount = items.length - Math.min(before, MAX_ITEMS);
  console.log(`\n✔ 扫描完成：${okCount}/${active.length} 频道在线 · 库存 ${items.length} 条（净增 ${Math.max(0, newCount)}）· 耗时 ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('✖ 采集失败:', err);
  process.exit(1);
});
