import { readFile, writeFile } from 'node:fs/promises';

const API_BASE = 'https://www.tabnews.com.br/api/v1/contents';
const POSTS_CACHE = new URL('../posts-cache.json', import.meta.url);
const BODIES_CACHE = new URL('../bodies-cache.json', import.meta.url);
const REQUEST_DELAY_MS = 350;
const MAX_RETRIES = 6;
const BATCH_LIMIT = Number(process.env.BATCH_LIMIT) || 500; // ponytail: incremental by design, run again to keep going
const SAVE_EVERY = 20;

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

async function loadJson(url, fallback) {
  try {
    return JSON.parse(await readFile(url, 'utf-8'));
  } catch {
    return fallback;
  }
}

async function main() {
  const postsCache = await loadJson(POSTS_CACHE, null);
  if (!postsCache) {
    console.error('posts-cache.json nao encontrado. Roda "npm run fetch" primeiro.');
    process.exit(1);
  }

  const posts = postsCache.posts;
  const bodies = await loadJson(BODIES_CACHE, {});

  const missing = posts
    .filter((p) => !(p.id in bodies) && p.owner_username && p.slug)
    .sort((a, b) => a.published_at.localeCompare(b.published_at)); // mais antigo primeiro
  console.log(`Bodies coletados: ${Object.keys(bodies).length}/${posts.length}. Faltam: ${missing.length}.`);

  const batch = missing.slice(0, BATCH_LIMIT);
  if (batch.length === 0) {
    console.log('Nada pra buscar, todos os bodies ja foram coletados.');
    return;
  }

  console.log(`Buscando ${batch.length} bodies nesta rodada (roda de novo pra continuar de onde parou)...`);

  let done = 0;
  for (const post of batch) {
    const url = `${API_BASE}/${encodeURIComponent(post.owner_username)}/${encodeURIComponent(post.slug)}`;

    try {
      const response = await fetchWithRetry(url);
      bodies[post.id] = response.ok ? (await response.json()).body || '' : '';
    } catch (err) {
      console.error(`Falhou ${post.owner_username}/${post.slug}: ${err.message}`);
    }

    done++;
    if (done % SAVE_EVERY === 0) {
      await writeFile(BODIES_CACHE, JSON.stringify(bodies), 'utf-8');
      console.log(`${done}/${batch.length} nesta rodada (progresso salvo)`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  await writeFile(BODIES_CACHE, JSON.stringify(bodies), 'utf-8');
  console.log(`Rodada concluida: +${done} bodies. Total: ${Object.keys(bodies).length}/${posts.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
