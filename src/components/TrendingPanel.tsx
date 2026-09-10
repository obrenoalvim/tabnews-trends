import type { TrendingEntry } from '../types';

export function TrendingPanel({ entries }: { entries: TrendingEntry[] }) {
  const maxCount = Math.max(...entries.flatMap((e) => [e.recentCount, e.previousCount]), 1);

  return (
    <div className="border-accent-dim/30 rounded border bg-ink-raised/60 p-4">
      <h2 className="text-paper-dim mb-3 font-mono text-xs uppercase tracking-[0.2em]">
        crescimento · últimos 2 meses vs 2 anteriores
      </h2>

      <ul className="space-y-2.5">
        {entries.map((entry, i) => (
          <li
            key={entry.label}
            className="rise-in grid grid-cols-[110px_1fr_64px] items-center gap-3"
            style={{ animationDelay: `${i * 35}ms` }}
          >
            <span className="truncate font-mono text-sm text-paper">{entry.label}</span>

            <div className="relative h-3.5 overflow-hidden rounded-sm bg-black/40">
              <div
                className="absolute inset-y-0 left-0 bg-accent-dim/60"
                style={{ width: `${(entry.previousCount / maxCount) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-accent shadow-[0_0_8px_rgba(90,209,255,0.6)]"
                style={{ width: `${(entry.recentCount / maxCount) * 100}%` }}
              />
            </div>

            <span
              className={`text-right font-mono text-xs font-semibold ${
                entry.growthPct >= 0 ? 'text-accent' : 'text-alarm'
              }`}
            >
              {entry.growthPct >= 0 ? '+' : ''}
              {entry.growthPct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
