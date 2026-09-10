import { readFile, writeFile } from 'node:fs/promises';

import { KEYWORDS } from './keywords.mjs';

const API_BASE = 'https://www.tabnews.com.br/api/v1/contents';
const PER_PAGE = 100;
const MAX_PAGES = Number(process.env.MAX_PAGES) || Infinity; // dev override for quick runs
const REQUEST_DELAY_MS = 400;
const MAX_RETRIES = 6;
const CACHE_FILE = new URL('../posts-cache.json', import.meta.url);
const BODIES_CACHE_FILE = new URL('../bodies-cache.json', import.meta.url);
const OUTPUT_FILE = new URL('../src/data/tabnews-trends.json', import.meta.url);
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // ponytail: dumb time-based cache, not real invalidation

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const compiledKeywords = KEYWORDS.map((kw) => ({
  ...kw,
  patterns: kw.aliases.map((alias) => new RegExp(`(?<![a-z0-9])${escapeRegex(alias.toLowerCase())}(?![a-z0-9])`, 'i')),
}));

function matchKeywords(text) {
  const lower = text.toLowerCase();
  const matched = new Set();
  for (const kw of compiledKeywords) {
    if (kw.patterns.some((p) => p.test(lower))) matched.add(kw.label);
  }
  return matched;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url);

    if (response.status !== 429) return response;

    const retryAfterSec = Number(response.headers.get('retry-after')) || 5 * (attempt + 1);
    console.log(`Rate limited (429), esperando ${retryAfterSec}s antes de tentar de novo...`);
    await sleep(retryAfterSec * 1000);
  }
  throw new Error('Rate limit persistente, desisti depois de varias tentativas.');
}

async function fetchAllPosts() {
  const posts = [];
  let totalPages = 1;

  for (let page = 1; page <= totalPages && page <= MAX_PAGES; page++) {
    const url = `${API_BASE}?strategy=new&page=${page}&per_page=${PER_PAGE}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      console.error(`Falhou pagina ${page}: HTTP ${response.status}`);
      break;
    }

    if (page === 1) {
      const totalRows = Number(response.headers.get('x-pagination-total-rows')) || 0;
      totalPages = Math.ceil(totalRows / PER_PAGE) || 1;
      console.log(`Total no TabNews: ${totalRows} posts (${totalPages} paginas)`);
    }

    const batch = await response.json();
    if (!batch.length) break;

    posts.push(...batch);
    console.log(`Pagina ${page}/${Math.min(totalPages, MAX_PAGES)}: +${batch.length} posts (total ${posts.length})`);

    await sleep(REQUEST_DELAY_MS);
  }

  return posts;
}

async function loadCache() {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(raw);
    if (Date.now() - cache.fetchedAt < CACHE_MAX_AGE_MS) return cache.posts;
    console.log('Cache expirado, buscando de novo.');
  } catch {
    // sem cache ainda, segue o fluxo normal
  }
  return null;
}

async function saveCache(posts) {
  await writeFile(CACHE_FILE, JSON.stringify({ fetchedAt: Date.now(), posts }), 'utf-8');
}

function monthKey(isoDate) {
  return isoDate.slice(0, 7); // YYYY-MM
}

function buildGraph(posts, bodies = {}) {
  const nodeCounts = new Map();
  const nodeTabcoins = new Map();
  const edgeCounts = new Map();
  const monthlyCounts = new Map(); // label -> Map(month -> count)

  let earliest = null;
  let latest = null;

  for (const post of posts) {
    if (!post.title || !post.published_at) continue;

    const text = bodies[post.id] ? `${post.title} ${bodies[post.id]}` : post.title;
    const matched = [...matchKeywords(text)];
    if (!matched.length) continue;

    const month = monthKey(post.published_at);
    if (!earliest || post.published_at < earliest) earliest = post.published_at;
    if (!latest || post.published_at > latest) latest = post.published_at;

    for (const label of matched) {
      nodeCounts.set(label, (nodeCounts.get(label) || 0) + 1);
      nodeTabcoins.set(label, (nodeTabcoins.get(label) || 0) + (post.tabcoins || 0));

      if (!monthlyCounts.has(label)) monthlyCounts.set(label, new Map());
      const monthMap = monthlyCounts.get(label);
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    }

    for (let i = 0; i < matched.length; i++) {
      for (let j = i + 1; j < matched.length; j++) {
        const key = [matched[i], matched[j]].sort().join('|||');
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }
    }
  }

  const nodes = [...nodeCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([label, count]) => ({
      id: label,
      label,
      count,
      tabcoins: nodeTabcoins.get(label) || 0,
    }));

  const validLabels = new Set(nodes.map((n) => n.id));

  const edges = [...edgeCounts.entries()]
    .map(([key, weight]) => {
      const [source, target] = key.split('|||');
      return { source, target, weight };
    })
    .filter((e) => validLabels.has(e.source) && validLabels.has(e.target) && e.weight >= 2);

  const months = [...new Set(posts.filter((p) => p.published_at).map((p) => monthKey(p.published_at)))].sort();
  const recentMonths = months.slice(-2);
  const previousMonths = months.slice(-4, -2);

  const trending = nodes
    .map((node) => {
      const monthMap = monthlyCounts.get(node.id) || new Map();
      const recentCount = recentMonths.reduce((sum, m) => sum + (monthMap.get(m) || 0), 0);
      const previousCount = previousMonths.reduce((sum, m) => sum + (monthMap.get(m) || 0), 0);
      const growthPct =
        previousCount === 0 ? (recentCount > 0 ? 100 : 0) : Math.round(((recentCount - previousCount) / previousCount) * 100);
      return { label: node.id, recentCount, previousCount, growthPct };
    })
    .filter((t) => t.recentCount + t.previousCount >= 3)
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 15);

  return {
    nodes,
    edges,
    trending,
    recentMonths,
    previousMonths,
    dateRange: { from: earliest, to: latest },
  };
}

// Nomes que compartilham o mesmo "assunto guarda-chuva" — a co-ocorrência entre
// eles é tautológica (falar de ChatGPT É falar de IA), não uma descoberta real.
const AI_FAMILY = new Set(['IA/LLM', 'ChatGPT', 'Claude', 'Copilot']);

function joinNatural(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

function computeInsights({ nodes, edges, trending }) {
  const insights = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const leader = [...nodes].sort((a, b) => b.count - a.count)[0];
  if (leader) {
    const leaderTrend = trending.find((t) => t.label === leader.label);
    if (leaderTrend) {
      const verb = leaderTrend.growthPct >= 0 ? 'cresceu' : 'caiu';
      insights.push(`${leader.label} lidera o volume (${leader.count} posts) e ${verb} ${Math.abs(leaderTrend.growthPct)}% no bimestre.`);
    } else {
      insights.push(`${leader.label} lidera o volume (${leader.count} posts).`);
    }
  }

  const riser = trending
    .filter((t) => t.growthPct > 0 && t.label !== leader?.label && t.recentCount + t.previousCount >= 6)
    .sort((a, b) => b.growthPct - a.growthPct)[0];
  if (riser) {
    insights.push(`${riser.label} cresceu no bimestre: de ${riser.previousCount} pra ${riser.recentCount} posts (+${riser.growthPct}%).`);
  }

  const byValuePerPost = nodes
    .filter((n) => n.count >= 10)
    .map((n) => ({ label: n.label, perPost: n.tabcoins / n.count }))
    .sort((a, b) => b.perPost - a.perPost)
    .slice(0, 3);
  if (byValuePerPost.length >= 2) {
    const names = joinNatural(byValuePerPost.map((n) => n.label));
    insights.push(`${names}: menos posts, mais tabcoins por post.`);
  }

  const topPairing = [...edges]
    .filter((e) => !(AI_FAMILY.has(e.source) && AI_FAMILY.has(e.target)))
    .sort((a, b) => b.weight - a.weight)[0];
  if (topPairing && byId.has(topPairing.source) && byId.has(topPairing.target)) {
    const a = byId.get(topPairing.source).label;
    const b = byId.get(topPairing.target).label;
    insights.push(`${a} e ${b} aparecem juntos em ${topPairing.weight} posts: quem cita um, cita o outro.`);
  }

  return insights;
}

async function main() {
  const forceRefresh = process.argv.includes('--refresh');
  let posts = forceRefresh ? null : await loadCache();

  if (posts) {
    console.log(`Usando cache local: ${posts.length} posts (--refresh pra rebuscar)`);
  } else {
    console.log('Buscando posts publicos do TabNews (isso demora alguns minutos no histórico completo)...');
    posts = await fetchAllPosts();
    console.log(`Total coletado: ${posts.length} posts`);
    await saveCache(posts);
  }

  let bodyMap = {};
  try {
    bodyMap = JSON.parse(await readFile(BODIES_CACHE_FILE, 'utf-8'));
  } catch {
    // sem bodies coletados ainda, roda "npm run fetch:bodies" pra melhorar a precisão
  }
  const bodyCount = Object.keys(bodyMap).length;
  if (bodyCount > 0) console.log(`Usando body de ${bodyCount} posts (fetch:bodies) alem do titulo.`);

  const graph = buildGraph(posts, bodyMap);
  console.log(`Keywords com sinal: ${graph.nodes.length}, conexoes: ${graph.edges.length}`);

  const insights = computeInsights(graph);

  const data = {
    generatedAt: new Date().toISOString(),
    postsAnalyzed: posts.length,
    ...graph,
    insights,
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Pronto: ${OUTPUT_FILE.pathname} atualizado. Roda "npm run dev" pra ver.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
