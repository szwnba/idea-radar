'use client';

import { useEffect, useState } from 'react';

/** SSR 输出绝对时间，挂载后换算相对时间（避免 hydration 不一致） */
export function RelativeTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string>(() => {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  });

  useEffect(() => {
    const tick = () => {
      const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
      if (mins < 1) setLabel('刚刚');
      else if (mins < 60) setLabel(`${mins} 分钟前`);
      else if (mins < 1440) setLabel(`${Math.floor(mins / 60)} 小时前`);
      else setLabel(`${Math.floor(mins / 1440)} 天前`);
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [iso]);

  return <span suppressHydrationWarning>{label}</span>;
}
