import { CHANNELS, CHANNEL_MAP } from '@/lib/channels';
import { topTags } from '@/lib/tags';
import type { Signal, SyncMeta } from '@/lib/types';
import { Sparkline } from './sparkline';
import type { DayStat } from '@/lib/types';

/** 底部情报栏：频道状态 / 本周关键词 / 信号量趋势 */
export function ChannelRail({
  meta,
  stats,
  recent,
}: {
  meta: SyncMeta | null;
  stats: DayStat[];
  recent: Signal[];
}) {
  const statusMap = new Map((meta?.sources ?? []).map((s) => [s.channel, s]));
  const tags = topTags(recent, 7, 8);

  return (
    <section className="grid gap-4 border-t border-edge py-8 md:grid-cols-3">
      {/* 频道状态 */}
      <div>
        <p className="mb-3 font-mono text-[10.5px] tracking-[0.28em] text-dim">CHANNELS — 频道状态</p>
        <ul className="space-y-1.5">
          {CHANNELS.map((ch) => {
            const st = statusMap.get(ch.id);
            const disabled = ch.enabled === false;
            const ok = !disabled && (st?.ok ?? false);
            const count = recent.filter((i) => i.channel === ch.id).length;
            return (
              <li key={ch.id} className={`flex items-center gap-2.5 text-[12.5px] ${disabled ? 'opacity-40' : ''}`}>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${ok ? 'bg-phosphor' : disabled ? 'bg-edge' : 'bg-hot/70'}`}
                  title={disabled ? '已禁用' : ok ? '信号正常' : st?.error ?? '信号中断'}
                />
                <span className="w-11 shrink-0 font-mono text-[10.5px] text-phosphor/70">{ch.code}</span>
                <span className={ok ? 'text-paper/85' : 'text-dim'}>{ch.name}</span>
                <span className="ml-auto font-mono text-[10.5px] text-dim">
                  {disabled ? '已禁用' : ok ? `${count} 条` : '中断'}
                </span>
              </li>
            );
          })}
        </ul>
        {!meta && <p className="mt-2 font-mono text-[10.5px] text-dim">— 等待首次扫描 —</p>}
      </div>

      {/* 本周关键词 */}
      <div>
        <p className="mb-3 font-mono text-[10.5px] tracking-[0.28em] text-dim">KEYWORDS — 本周关键词</p>
        {tags.length === 0 ? (
          <p className="font-mono text-[11px] text-dim">数据积累中…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }, i) => (
              <span
                key={tag}
                className="rounded-full border border-edge px-3 py-1 font-mono text-[12px]"
                style={{
                  color: i === 0 ? '#ffb454' : '#e9e4d6',
                  borderColor: i === 0 ? 'rgba(255,180,84,0.45)' : undefined,
                }}
              >
                #{tag} <span className="text-dim">{count}</span>
              </span>
            ))}
          </div>
        )}
        <p className="mt-4 text-[12px] leading-relaxed text-dim">
          标签按关键词规则自动归类，热度随时间衰减 — 旧信号会自然冷却。
        </p>
      </div>

      {/* 趋势 */}
      <div>
        <p className="mb-3 font-mono text-[10.5px] tracking-[0.28em] text-dim">VOLUME — 信号量趋势</p>
        <Sparkline stats={stats} />
        {meta && (
          <p className="mt-2 font-mono text-[10.5px] text-dim">
            上轮扫描 {meta.sources.filter((s) => s.ok).length}/{meta.sources.length} 频道在线 · 耗时{' '}
            {(meta.durationMs / 1000).toFixed(0)}s · 每 2 小时自动巡扫
          </p>
        )}
      </div>
    </section>
  );
}
