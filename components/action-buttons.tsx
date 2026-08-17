'use client';

import { hideSignal, removeFavorite, toggleFavorite, unhideSignal, useRadarStore } from '@/lib/store';
import type { Signal } from '@/lib/types';

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.2l2.66 5.5 6.05.85-4.4 4.2 1.07 6L12 16.9l-5.38 2.85 1.07-6-4.4-4.2 6.05-.85L12 3.2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.6" />
      <line x1="6.2" y1="6.2" x2="17.8" y2="17.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const base =
  'inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-dim transition-colors hover:border-edge hover:bg-raised hover:text-phosphor';

/** 信号行上的星标按钮：收藏 / 取消收藏 */
export function StarButton({ signal, filledOverride }: { signal: Signal; filledOverride?: boolean }) {
  const { favs } = useRadarStore();
  const filled = filledOverride ?? favs.some((f) => f.id === signal.id);
  return (
    <button
      type="button"
      className={`${base} ${filled ? 'text-phosphor' : ''}`}
      aria-label={filled ? `取消收藏：${signal.title}` : `收藏：${signal.title}`}
      aria-pressed={filled}
      title={filled ? '取消收藏' : '收藏'}
      onClick={() => toggleFavorite(signal)}
    >
      <StarIcon filled={filled} />
    </button>
  );
}

/** 收藏页里的移除按钮（始终实心星） */
export function UnfavButton({ item }: { item: { id: string; title: string } }) {
  return (
    <button
      type="button"
      className={`${base} text-phosphor`}
      aria-label={`移出收藏夹：${item.title}`}
      title="移出收藏夹"
      onClick={() => removeFavorite(item.id)}
    >
      <StarIcon filled />
    </button>
  );
}

/** 信号行上的「不看」按钮：隐藏该信号 */
export function HideButton({ signal }: { signal: Signal }) {
  return (
    <button
      type="button"
      className={base}
      aria-label={`不再显示：${signal.title}`}
      title="不看（可在收藏页恢复）"
      onClick={() => hideSignal(signal)}
    >
      <EyeOffIcon />
    </button>
  );
}

/** 隐藏列表里的恢复按钮 */
export function RestoreButton({ item }: { item: { id: string; title: string } }) {
  return (
    <button
      type="button"
      className="border border-edge px-2.5 py-1 font-mono text-[11px] text-dim transition-colors hover:border-phosphor/50 hover:text-phosphor"
      aria-label={`恢复显示：${item.title}`}
      onClick={() => unhideSignal(item.id)}
    >
      恢复
    </button>
  );
}
