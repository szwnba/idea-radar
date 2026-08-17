'use client';

import { useMemo, useState } from 'react';
import { CHANNEL_MAP } from '@/lib/channels';
import { useRadarStore } from '@/lib/store';
import type { Signal } from '@/lib/types';
import { HideButton, StarButton } from './action-buttons';

const CX = 200;
const CY = 200;
const R_OUTER = 178;
const R_MAX = 160; // 48h
const R_MIN = 30; // newest

function polar(deg: number, r: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

/** id → 稳定的伪随机抖动，避免同频道光点重叠 */
function jitterOf(id: string): { angle: number; radius: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return { angle: (h % 29) - 14, radius: ((h >>> 8) % 13) - 6 };
}

function blipGeom(item: Signal, now: number) {
  const ageH = Math.max(0, (now - new Date(item.publishedAt).getTime()) / 3_600_000);
  const t = Math.min(1, ageH / 48);
  const j = jitterOf(item.id);
  const r = Math.max(R_MIN - 4, R_MIN + (R_MAX - R_MIN) * t + j.radius);
  const deg = CHANNEL_MAP[item.channel].angle + j.angle;
  return polar(deg, r);
}

function HeatBars({ heat, hot = false }: { heat: number; hot?: boolean }) {
  const on = Math.max(1, Math.round(heat / (100 / 6)));
  return (
    <span className="flex items-end gap-[3px]" aria-label={`热度 ${heat}`}>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={`heat-cell ${i < on ? `on${hot ? ' hot' : ''}` : ''}`} />
      ))}
    </span>
  );
}

interface Blip extends Signal {
  x: number;
  y: number;
  size: number;
  isTop: boolean;
}

export function RadarHero({ fresh }: { fresh: Signal[] }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const { hidden } = useRadarStore();
  const hiddenIds = useMemo(() => new Set(hidden.map((h) => h.id)), [hidden]);

  // 隐藏过滤后重算今日最强（顺位递补）
  const visibleFresh = useMemo(() => fresh.filter((s) => !hiddenIds.has(s.id)), [fresh, hiddenIds]);
  const top = useMemo(
    () => [...visibleFresh].sort((a, b) => b.heat - a.heat).slice(0, 3),
    [visibleFresh],
  );
  const topIds = useMemo(() => new Set(top.map((t) => t.id)), [top]);

  const blips: Blip[] = useMemo(() => {
    const now = Date.now();
    return visibleFresh
      .map((item) => {
        const { x, y } = blipGeom(item, now);
        return { ...item, x, y, size: 2.5 + item.heat / 28, isTop: topIds.has(item.id) };
      })
      .sort((a, b) => a.heat - b.heat); // 低热度先画，高热度在上层
  }, [visibleFresh, topIds]);

  const hovered = blips.find((b) => b.id === hoverId);
  const rings = [
    { r: 62.5, label: '12H' },
    { r: 95, label: '24H' },
    { r: 127.5, label: '36H' },
    { r: 160, label: '48H' },
  ];

  return (
    <section className="flex flex-col items-center gap-8 py-10 lg:flex-row lg:items-stretch lg:gap-12">
      {/* 雷达盘 */}
      <div className="w-full max-w-[440px] shrink-0">
        <svg viewBox="0 0 400 400" className="w-full" role="img" aria-label={`雷达图：在轨信号 ${blips.length} 条`}>
          <defs>
            <radialGradient id="dishGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb454" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#ffb454" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sweepGrad" gradientUnits="userSpaceOnUse" x1="200" y1="30" x2="46" y2="140">
              <stop offset="0%" stopColor="#ffb454" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffb454" stopOpacity="0" />
            </linearGradient>
          </defs>

          <circle cx={CX} cy={CY} r={R_OUTER} fill="url(#dishGlow)" />

          {/* 数据环：半径 = 新近度 */}
          {rings.map((ring) => (
            <g key={ring.label}>
              <circle cx={CX} cy={CY} r={ring.r} fill="none" stroke="#1f2c47" strokeWidth="1" />
              <text x={CX + 5} y={CY - ring.r + 11} fontSize="8" fill="#8a94ad" fontFamily="IBM Plex Mono, monospace">
                {ring.label}
              </text>
            </g>
          ))}

          {/* 十字线 */}
          <line x1={CX} y1={CY - R_OUTER} x2={CX} y2={CY + R_OUTER} stroke="#1f2c47" strokeWidth="1" strokeDasharray="2 6" />
          <line x1={CX - R_OUTER} y1={CY} x2={CX + R_OUTER} y2={CY} stroke="#1f2c47" strokeWidth="1" strokeDasharray="2 6" />

          {/* 外环 + 频道刻度与代号（已禁用频道不占刻度） */}
          <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="#2a3a5f" strokeWidth="1.5" />
          {Object.values(CHANNEL_MAP)
            .filter((ch) => ch.enabled !== false)
            .map((ch) => {
            const p1 = polar(ch.angle, R_OUTER - 4);
            const p2 = polar(ch.angle, R_OUTER + 4);
            const lp = polar(ch.angle, R_OUTER + 16);
            return (
              <g key={ch.id}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#8a94ad" strokeWidth="1" />
                <text
                  x={Math.max(14, Math.min(386, lp.x))}
                  y={lp.y + 3}
                  fontSize="9"
                  fill="#8a94ad"
                  textAnchor="middle"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {ch.code}
                </text>
              </g>
            );
          })}

          {/* 扫描线 */}
          <g className="radar-sweep">
            <path d={`M ${CX} ${CY} L ${CX} ${CY - 170} A 170 170 0 0 0 46 140 Z`} fill="url(#sweepGrad)" />
            <line x1={CX} y1={CY} x2={CX} y2={CY - 170} stroke="#ffb454" strokeWidth="1.5" opacity="0.9" />
          </g>

          {/* 中心站 */}
          <circle cx={CX} cy={CY} r="3" fill="#ffb454" />

          {/* 信号光点 */}
          {blips.map((b) => (
            <a
              key={b.id}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHoverId(b.id)}
              onMouseLeave={() => setHoverId((cur) => (cur === b.id ? null : cur))}
            >
              {b.isTop && (
                <circle cx={b.x} cy={b.y} r={b.size + 4} fill="none" stroke="#ff6b4a" strokeWidth="1" className="blip-pulse" />
              )}
              <circle
                cx={b.x}
                cy={b.y}
                r={b.size}
                fill={b.isTop ? '#ff6b4a' : '#ffb454'}
                opacity={hoverId === b.id ? 1 : 0.45 + (b.heat / 100) * 0.55}
              />
              <title>{`[${CHANNEL_MAP[b.channel].code}] ${b.title} · 热度 ${b.heat}`}</title>
            </a>
          ))}
        </svg>

        {/* 读数行 */}
        <div className="mt-2 border-t border-edge pt-2 font-mono text-[11px] text-dim">
          {hovered ? (
            <span className="text-phosphor">
              ▸ [{CHANNEL_MAP[hovered.channel].code}] {hovered.heat.toString().padStart(2, '0')} ·{' '}
              <span className="text-paper/80">{hovered.title}</span>
            </span>
          ) : (
            <span>
              在轨信号 <span className="text-paper">{blips.length}</span> 条 · 半径 = 新近度 · 亮度 = 热度
            </span>
          )}
        </div>
      </div>

      {/* 今日最强信号 */}
      <div className="flex w-full flex-1 flex-col justify-center gap-4">
        <p className="font-mono text-[11px] tracking-[0.28em] text-dim">
          TODAY&apos;S STRONGEST — 今日最强信号
        </p>
        {top.length === 0 && (
          <p className="rounded-lg border border-edge bg-panel px-4 py-6 text-center text-sm text-dim">
            等待首次扫描 · 信号入库后此处点亮
          </p>
        )}
        {top.map((item, i) => {
          const ch = CHANNEL_MAP[item.channel];
          const active = hoverId === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoverId(item.id)}
              onMouseLeave={() => setHoverId((cur) => (cur === item.id ? null : cur))}
              className={`group/card flex items-stretch rounded-lg border transition-colors ${
                active ? 'border-phosphor/50 bg-raised' : 'border-edge bg-panel hover:border-phosphor/30'
              }`}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-start gap-4 px-4 py-3.5"
              >
                <span
                  className={`mt-0.5 font-mono text-xl leading-none ${i === 0 ? 'text-hot' : 'text-phosphor'}`}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-[15px] font-medium text-paper group-hover/card:text-phosphor">
                      {item.title}
                    </span>
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-dim">
                    <span className="text-phosphor/80">{ch.code}</span>
                    <span>{ch.name}</span>
                    {item.points > 0 && <span>▲ {item.points.toLocaleString()}</span>}
                    {item.comments > 0 && <span>✉ {item.comments}</span>}
                    <span>{item.tags.map((t) => `#${t}`).join(' ')}</span>
                  </span>
                </span>
              </a>
              <div className="flex flex-col items-end justify-center gap-1.5 pr-3">
                <HeatBars heat={item.heat} hot={i === 0} />
                <div className="flex gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover/card:opacity-100 lg:focus-within:opacity-100">
                  <StarButton signal={item} />
                  <HideButton signal={item} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
