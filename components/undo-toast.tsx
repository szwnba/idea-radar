'use client';

import { useEffect } from 'react';
import { clearToast, unhideSignal, useRadarStore } from '@/lib/store';

/** 隐藏信号后底部出现的撤销提示，6 秒后自动消失 */
export function UndoToast() {
  const { toast } = useRadarStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clearToast(), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="flex max-w-full items-center gap-3 rounded-lg border border-edge bg-panel px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
        <span className="truncate text-[13px] text-dim">
          已隐藏 <span className="text-paper/85">{toast.title}</span>
        </span>
        <button
          type="button"
          onClick={() => unhideSignal(toast.id)}
          className="shrink-0 border border-phosphor/50 px-2.5 py-1 font-mono text-[11px] text-phosphor transition-colors hover:bg-phosphor hover:text-night"
        >
          撤销
        </button>
      </div>
    </div>
  );
}
