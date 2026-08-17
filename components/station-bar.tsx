'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRadarStore } from '@/lib/store';

function fmtClock(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function fmtAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

/** 顶栏：站名 + 收藏入口 + 实时时钟 + 同步状态 */
export function StationBar({ lastSync }: { lastSync: string | null }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const { favs } = useRadarStore();

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-night/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3 leading-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-phosphor beacon shadow-[0_0_10px_rgba(255,180,84,0.8)]" />
          <span>
            <span className="block text-[15px] font-semibold tracking-wide">灵感雷达</span>
            <span className="block font-mono text-[10px] tracking-[0.28em] text-dim">IDEA RADAR</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 font-mono text-[11px] text-dim sm:gap-6">
          <Link
            href="/favorites"
            className="flex items-center gap-1.5 transition-colors hover:text-phosphor"
            title="我的收藏"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3.2l2.66 5.5 6.05.85-4.4 4.2 1.07 6L12 16.9l-5.38 2.85 1.07-6-4.4-4.2 6.05-.85L12 3.2z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span className="text-paper/80" suppressHydrationWarning>
              {mounted ? favs.length : 0}
            </span>
          </Link>
          <span suppressHydrationWarning className="tabular-nums">
            {mounted && now ? fmtClock(now) : '--:--:--'}
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="text-[9px] tracking-[0.2em]">SYNC</span>
            <span className="text-phosphor" suppressHydrationWarning>
              {mounted && lastSync ? fmtAgo(lastSync) : lastSync ? '—' : '待首次扫描'}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
