import type { Signal } from './types';

/**
 * 热度 = 频道内互动量(60%) + 新近度(30%) + 关键词加成(10%)
 * 每次同步对全量信号重算，旧信号自然冷却。
 */

const HALF_LIFE_HOURS = 36;

function logNorm(value: number, ref: number): number {
  if (value <= 0 || ref <= 0) return 0;
  return Math.min(1, Math.log(1 + value) / Math.log(1 + ref));
}

export function computeHeat(items: Signal[], now = new Date()): Signal[] {
  // 每个频道取 95 分位互动量作为归一化基准，避免单条爆款压扁全组
  const byChannel = new Map<string, number[]>();
  for (const it of items) {
    const list = byChannel.get(it.channel) ?? [];
    list.push(it.points || it.comments);
    byChannel.set(it.channel, list);
  }
  const refOf = new Map<string, number>();
  for (const [ch, values] of byChannel) {
    const sorted = [...values].sort((a, b) => a - b);
    refOf.set(ch, sorted[Math.floor(sorted.length * 0.95)] || 0);
  }

  return items.map((it) => {
    const engagement = logNorm(it.points || it.comments, refOf.get(it.channel) ?? 0);
    const ageH = Math.max(0, (now.getTime() - new Date(it.publishedAt).getTime()) / 3_600_000);
    const recency = Math.exp((-Math.LN2 * ageH) / HALF_LIFE_HOURS);
    const boost = it.tags.length > 0 ? Math.min(1, 0.34 * it.tags.length) : 0;
    const heat = Math.round(100 * (0.6 * engagement + 0.3 * recency + 0.1 * boost));
    return { ...it, heat: Math.max(1, Math.min(100, heat)) };
  });
}
