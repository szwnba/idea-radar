import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { DayStat, Signal, SyncMeta } from './types';

export interface RadarData {
  /** 近 48h 信号（雷达图光点 + 今日精选池） */
  fresh: Signal[];
  /** 近 14 天信号（信号流列表） */
  recent: Signal[];
  top: Signal[];
  meta: SyncMeta | null;
  stats: DayStat[];
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), 'data', file), 'utf-8')) as T;
  } catch {
    return null;
  }
}

export async function loadRadarData(): Promise<RadarData> {
  const [items, meta, stats] = await Promise.all([
    readJson<Signal[]>('items.json'),
    readJson<SyncMeta>('meta.json'),
    readJson<DayStat[]>('stats.json'),
  ]);

  const all = items ?? [];
  const now = Date.now();
  const within = (hours: number) =>
    all.filter((s) => now - new Date(s.publishedAt).getTime() < hours * 3_600_000);

  const fresh = within(48);
  const recent = within(24 * 14).slice(0, 400);
  const top = [...fresh].sort((a, b) => b.heat - a.heat).slice(0, 3);

  return { fresh, recent, top, meta, stats: stats ?? [] };
}
