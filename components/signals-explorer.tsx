'use client';

import { useMemo, useState } from 'react';
import { CHANNELS, CHANNEL_MAP } from '@/lib/channels';
import type { ChannelId, Signal } from '@/lib/types';
import { RelativeTime } from './relative-time';

type SortMode = 'heat' | 'newest';
const PAGE = 40;

function SignalRow({ item }: { item: Signal }) {
  const ch = CHANNEL_MAP[item.channel];
  const on = Math.max(1, Math.round(item.heat / (100 / 6)));
  return (
    <li className="border-b border-edge/60 last:border-b-0">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-3 px-3 py-3 transition-colors hover:bg-raised/60 sm:gap-4 sm:px-4"
      >
        {/* 热度 */}
        <span className="mt-1 flex w-[52px] shrink-0 items-center gap-1.5">
          <span className="font-mono text-sm tabular-nums text-phosphor">{item.heat}</span>
          <span className="flex items-end gap-[2px]">
            {Array.from({ length: 6 }, (_, i) => (
              <span
                key={i}
                className={`heat-cell !h-[10px] !w-[3px] ${i < on ? (item.heat >= 85 ? 'on hot' : 'on') : ''}`}
              />
            ))}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="shrink-0 font-mono text-[10px] tracking-wider text-phosphor/70">{ch.code}</span>
            <span className="truncate text-[14px] font-medium text-paper group-hover:text-phosphor">
              {item.title}
            </span>
          </span>
          {item.summary && (
            <span className="mt-1 line-clamp-1 block text-[12.5px] leading-relaxed text-dim">{item.summary}</span>
          )}
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-dim">
            <RelativeTime iso={item.publishedAt} />
            {item.points > 0 && <span>▲ {item.points.toLocaleString()}</span>}
            {item.comments > 0 && <span>✉ {item.comments}</span>}
            {item.author && <span className="truncate max-w-[160px]">@{item.author}</span>}
            {item.tags.map((t) => (
              <span key={t} className="text-phosphor/60">
                #{t}
              </span>
            ))}
          </span>
        </span>
      </a>
    </li>
  );
}

export function SignalsExplorer({ items }: { items: Signal[] }) {
  const [channel, setChannel] = useState<ChannelId | 'all'>('all');
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('heat');
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(() => {
    const m = new Map<ChannelId, number>();
    for (const it of items) m.set(it.channel, (m.get(it.channel) ?? 0) + 1);
    return m;
  }, [items]);

  const availableTags = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) for (const t of it.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (channel !== 'all') list = list.filter((i) => i.channel === channel);
    if (tag) list = list.filter((i) => i.tags.includes(tag));
    return [...list].sort((a, b) =>
      sort === 'heat' ? b.heat - a.heat : b.publishedAt.localeCompare(a.publishedAt),
    );
  }, [items, channel, tag, sort]);

  const shown = filtered.slice(0, limit);

  return (
    <section className="py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.28em] text-dim">SIGNAL LOG — 信号流</p>
        <div className="flex items-center gap-1 border border-edge p-0.5 font-mono text-[10px]">
          {(['heat', 'newest'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSort(m)}
              className={`px-2.5 py-1 transition-colors ${sort === m ? 'bg-phosphor text-night' : 'text-dim hover:text-paper'}`}
            >
              {m === 'heat' ? '热度' : '最新'}
            </button>
          ))}
        </div>
      </div>

      {/* 频道 + 标签过滤 */}
      <div className="mb-5 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={channel === 'all'} onClick={() => { setChannel('all'); setLimit(PAGE); }}>
            全部 <span className="opacity-60">{items.length}</span>
          </FilterChip>
          {CHANNELS.filter((c) => (counts.get(c.id) ?? 0) > 0).map((c) => (
            <FilterChip
              key={c.id}
              active={channel === c.id}
              onClick={() => { setChannel(c.id); setLimit(PAGE); }}
              title={c.name}
            >
              {c.code} <span className="opacity-60">{counts.get(c.id)}</span>
            </FilterChip>
          ))}
        </div>
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map(([t, n]) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTag(tag === t ? null : t); setLimit(PAGE); }}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
                  tag === t
                    ? 'border-phosphor bg-phosphor/15 text-phosphor'
                    : 'border-edge text-dim hover:border-dim hover:text-paper'
                }`}
              >
                #{t} <span className="opacity-50">{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-edge bg-panel px-4 py-10 text-center text-sm text-dim">
          该频道暂无信号 · 等待下一轮扫描
        </p>
      ) : (
        <>
          <ul className="divide-y divide-edge/60 rounded-xl border border-edge bg-panel">
            {shown.map((item) => (
              <SignalRow key={item.id} item={item} />
            ))}
          </ul>
          {filtered.length > limit && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="border border-edge px-4 py-2 font-mono text-[11px] text-dim transition-colors hover:border-phosphor/50 hover:text-phosphor"
              >
                展开更多信号（{filtered.length - limit}）
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`border px-2.5 py-1 font-mono text-[11px] transition-colors ${
        active
          ? 'border-phosphor bg-phosphor text-night'
          : 'border-edge text-dim hover:border-dim hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}
