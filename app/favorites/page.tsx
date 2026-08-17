'use client';

import Link from 'next/link';
import { CHANNEL_MAP } from '@/lib/channels';
import { clearHidden, useRadarStore } from '@/lib/store';
import { RestoreButton, UnfavButton } from '@/components/action-buttons';
import { RelativeTime } from '@/components/relative-time';
import type { FavItem } from '@/lib/store';

function FavRow({ item }: { item: FavItem }) {
  const ch = CHANNEL_MAP[item.channel];
  return (
    <li className="border-b border-edge/60 last:border-b-0">
      <div className="group/row flex items-stretch">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5 transition-colors hover:bg-raised/60"
        >
          <span className="mt-0.5 shrink-0 font-mono text-[10px] tracking-wider text-phosphor/70">{ch.code}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-paper group-hover/row:text-phosphor">
              {item.title}
            </span>
            {item.summary && (
              <span className="mt-1 line-clamp-1 block text-[12.5px] leading-relaxed text-dim">{item.summary}</span>
            )}
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-dim">
              <span>收藏于 <RelativeTime iso={item.savedAt} /></span>
              <span className="text-phosphor/70">热度 {item.heat}</span>
              {item.points > 0 && <span>▲ {item.points.toLocaleString()}</span>}
              {item.tags.map((t) => (
                <span key={t} className="text-phosphor/60">
                  #{t}
                </span>
              ))}
            </span>
          </span>
        </a>
        <div className="flex items-center pr-3">
          <UnfavButton item={item} />
        </div>
      </div>
    </li>
  );
}

export default function FavoritesPage() {
  const { favs, hidden } = useRadarStore();

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-4 sm:px-6">
        {/* 收藏夹 */}
        <section className="py-10">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] tracking-[0.28em] text-dim">
              FAVORITES — 收藏夹
            </p>
            <p className="font-mono text-[11px] text-dim">
              <span className="text-phosphor">{favs.length}</span> 条 · 保存在本浏览器
            </p>
          </div>

          {favs.length === 0 ? (
            <div className="rounded-lg border border-edge bg-panel px-4 py-12 text-center">
              <p className="text-sm text-dim">收藏夹是空的</p>
              <p className="mt-2 text-[13px] text-dim/70">
                在信号流里点亮星标，有价值的灵感就会存到这里
              </p>
              <Link
                href="/"
                className="mt-5 inline-block border border-phosphor/50 px-4 py-2 font-mono text-[11px] text-phosphor transition-colors hover:bg-phosphor hover:text-night"
              >
                返回雷达站
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-edge/60 rounded-xl border border-edge bg-panel">
              {favs.map((item) => (
                <FavRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>

        {/* 隐藏管理 */}
        <section className="border-t border-edge py-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] tracking-[0.28em] text-dim">HIDDEN — 不看列表</p>
            {hidden.length > 0 && (
              <button
                type="button"
                onClick={clearHidden}
                className="border border-edge px-3 py-1 font-mono text-[11px] text-dim transition-colors hover:border-hot/60 hover:text-hot"
              >
                全部恢复
              </button>
            )}
          </div>

          {hidden.length === 0 ? (
            <p className="font-mono text-[11px] text-dim/70">没有隐藏的信号</p>
          ) : (
            <ul className="divide-y divide-edge/60 rounded-xl border border-edge bg-panel">
              {hidden.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-dim">{h.title}</span>
                  <RestoreButton item={h} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-edge">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 font-mono text-[10.5px] text-dim sm:px-6">
          <span>IDEA RADAR · 收藏与隐藏存储在本浏览器 localStorage</span>
          <Link href="/" className="transition-colors hover:text-phosphor">
            ← 返回雷达站
          </Link>
        </div>
      </footer>
    </>
  );
}
