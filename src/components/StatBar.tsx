function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function StatBar({
  postsAnalyzed,
  from,
  to,
  generatedAt,
}: {
  postsAnalyzed: number;
  from: string | null;
  to: string | null;
  generatedAt: string;
}) {
  const items = [
    { label: 'posts analisados', value: postsAnalyzed.toLocaleString('pt-BR') },
    { label: 'período', value: `${formatDate(from)} → ${formatDate(to)}` },
    { label: 'gerado em', value: new Date(generatedAt).toLocaleString('pt-BR') },
  ];

  return (
    <div className="border-accent-dim/30 flex flex-wrap gap-x-8 gap-y-1 border-b px-6 py-3 font-mono text-xs text-paper-dim">
      {items.map((item) => (
        <span key={item.label}>
          <span className="text-accent-dim">{item.label}:</span> {item.value}
        </span>
      ))}
    </div>
  );
}
