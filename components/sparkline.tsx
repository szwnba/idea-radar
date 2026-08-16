import type { DayStat } from '@/lib/types';

/** 7-14 日信号量 sparkline（纯 SVG，无依赖） */
export function Sparkline({ stats }: { stats: DayStat[] }) {
  const data = stats.slice(-14);
  if (data.length < 2) {
    return <div className="font-mono text-[11px] text-dim">数据积累中…</div>;
  }

  const W = 260;
  const H = 44;
  const max = Math.max(...data.map((d) => d.count), 1);
  const step = W / (data.length - 1);
  const pts = data.map((d, i) => [i * step, H - 4 - ((d.count / max) * (H - 12)) - 0.5] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `0,${H} ${line} ${W},${H}`;
  const last = pts[pts.length - 1];

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-full" role="img" aria-label="每日信号量趋势">
        <polygon points={area} fill="rgba(255,180,84,0.08)" />
        <polyline points={line} fill="none" stroke="#ffb454" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="2.5" fill="#ff6b4a" />
      </svg>
      <figcaption className="mt-1 flex justify-between font-mono text-[9.5px] text-dim">
        <span>{data[0].date.slice(5)}</span>
        <span>峰值 {max} 条/日</span>
        <span>{data[data.length - 1].date.slice(5)}</span>
      </figcaption>
    </figure>
  );
}
