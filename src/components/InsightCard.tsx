export function InsightCard({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="border-accent-dim/30 rounded border bg-ink-raised/60 p-4">
      <h2 className="text-paper-dim mb-3 font-mono text-xs uppercase tracking-[0.2em]">leitura dos dados</h2>

      <ul className="space-y-3">
        {insights.map((line, i) => (
          <li
            key={line}
            className="rise-in flex gap-2 font-mono text-xs leading-relaxed text-paper"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-accent shrink-0">▸</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
