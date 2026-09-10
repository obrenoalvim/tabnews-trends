import data from './data/tabnews-trends.json';
import { GraphCanvas } from './components/GraphCanvas';
import { StatBar } from './components/StatBar';
import { TrendingPanel } from './components/TrendingPanel';
import type { TrendsData } from './types';

const trends = data as TrendsData;

export default function App() {
  return (
    <div className="boot-flicker flex h-screen flex-col overflow-hidden">
      <header className="relative overflow-hidden border-amber-dim/30 border-b px-6 py-5">
        <div className="scanlines grain pointer-events-none absolute inset-0" />
        <h1 className="text-shadow-glow font-mono text-2xl font-semibold text-amber">
          &gt; tabnews_trends
          <span className="cursor-blink text-amber">_</span>
        </h1>
        <p className="mt-1 font-mono text-xs text-paper-dim">
          grafo de tecnologias mencionadas no histórico completo do TabNews
        </p>
      </header>

      <StatBar
        postsAnalyzed={trends.postsAnalyzed}
        from={trends.dateRange.from}
        to={trends.dateRange.to}
        generatedAt={trends.generatedAt}
      />

      <main className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1fr_380px]">
        <section className="border-amber-dim/30 relative min-h-[420px] min-w-0 overflow-hidden rounded border bg-black/30">
          <GraphCanvas nodes={trends.nodes} edges={trends.edges} />
        </section>

        <aside className="min-h-0 overflow-y-auto">
          <TrendingPanel entries={trends.trending} />
          <p className="mt-4 px-1 font-mono text-[11px] leading-relaxed text-paper-dim">
            extraído do título dos posts (heurística por palavra-chave, não NLP). tamanho do nó = nº de posts
            mencionando o termo. espessura da conexão = nº de posts que citam os dois termos juntos.
          </p>
        </aside>
      </main>
    </div>
  );
}
