import { ChannelRail } from '@/components/channel-rail';
import { RadarHero } from '@/components/radar-hero';
import { SignalsExplorer } from '@/components/signals-explorer';
import { StationBar } from '@/components/station-bar';
import { UndoToast } from '@/components/undo-toast';
import { loadRadarData } from '@/lib/data';

export default async function Home() {
  const { fresh, recent, meta, stats } = await loadRadarData();

  return (
    <>
      <StationBar lastSync={meta?.lastSync ?? null} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <RadarHero fresh={fresh} />
        <SignalsExplorer items={recent} />
        <ChannelRail meta={meta} stats={stats} recent={recent} />
      </main>

      <footer className="border-t border-edge">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 font-mono text-[10.5px] text-dim sm:px-6">
          <span>IDEA RADAR · 无人值守信号站</span>
          <span>GitHub Actions 每 2h 巡扫 → 数据入库 → Vercel 自动重建</span>
        </div>
      </footer>

      <UndoToast />
    </>
  );
}
