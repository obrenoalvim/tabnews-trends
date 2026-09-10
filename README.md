# tabnews_trends

Grafo interativo das tecnologias mais mencionadas no [TabNews](https://www.tabnews.com.br/), extraído do histórico completo de posts via API pública.

![screenshot do grafo](docs/screenshot.jpg)

## Rodando local

```bash
npm install
npm run fetch          # busca o histórico completo do TabNews e gera src/data/tabnews-trends.json
npm run fetch:bodies   # opcional: busca o corpo dos posts pra melhorar a precisão (incremental, veja abaixo)
npm run dev            # abre em http://localhost:5173
```

`npm run fetch` pagina a API pública (`/api/v1/contents`) inteira, com retry/backoff em rate limit (429) e cache local (`posts-cache.json`, 6h) pra não rebuscar tudo a cada troca de keyword.

`npm run fetch:bodies` busca o corpo de cada post individualmente (a API de listagem só devolve título). São ~30 mil requests, então roda em lotes (`BATCH_LIMIT`, padrão 500 por rodada) do post mais antigo pro mais novo, salvando progresso em `bodies-cache.json`. Roda de novo quantas vezes quiser pra continuar de onde parou; `npm run fetch` já usa os bodies coletados até o momento.

## Como funciona

- Extrai termos técnicos do **título** (e do corpo, quando já coletado via `fetch:bodies`) dos posts por casamento de palavra-chave (`scripts/keywords.mjs`) — heurística simples, não NLP.
- Tamanho do nó = nº de posts mencionando o termo. Espessura da conexão = nº de posts que citam os dois termos juntos.
- Painel lateral mostra os termos com maior variação (últimos 2 meses vs. 2 anteriores).

## Stack

Vite + React + TypeScript, Tailwind, [vis-network](https://github.com/visjs/vis-network) pro grafo (física `forceAtlas2Based`).

## Licença

MIT — mesmo espírito do [repositório do TabNews](https://github.com/filipedeschamps/tabnews.com.br).
