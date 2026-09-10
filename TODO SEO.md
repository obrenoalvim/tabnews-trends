# TODO SEO

> Last updated: 2026-09-09

## Pending Changes

### Atualizar links do llms.txt pra URL real quando o repo tiver uma
- **Source:** https://llmstxt.org (spec), pesquisa "llms.txt file spec 2026"
- **What:** `public/llms.txt` usa paths relativos (`/README.md`, `/scripts/...`). Se o repo for pra um GitHub público ou o app for deployado, trocar pra URLs absolutas do domínio/repo real.
- **Where:** `public/llms.txt`
- **Why:** paths relativos só resolvem certo se um agente já estiver navegando dentro do repo/site; URL absoluta é o que a spec espera pra descoberta externa.
- **Risk:** nenhum — só fica desatualizado até decidir onde o projeto mora.
- **Effort:** Low

### robots.txt / sitemap.xml — não aplicado
- **Source:** pesquisa "llms.txt spec 2026 when needed small project", Google Search Central guidance
- **What:** não criei `robots.txt` nem `sitemap.xml`.
- **Where:** seriam em `public/`
- **Why:** projeto ainda não tem deploy/domínio — não existe URL pra rastrear, e um sitemap de SPA de página única seria boilerplate vazio sem propósito real. Revisitar se/quando o app for deployado com domínio próprio.
- **Risk:** nenhum, decisão consciente de não aplicar agora.
- **Effort:** Low (quando fizer sentido)
