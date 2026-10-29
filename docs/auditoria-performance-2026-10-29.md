# Auditoria de performance, integridade e confiabilidade

Data: 29/10/2026. Projeto: **Rota do Dólar**, repositório privado `Tiagogomezdigital/rota-do-dolar`.

Implementação na branch `codex/performance-audit`, comparada ao commit `fac9fc20f7ba11565603f902948fec218a8fc555`. Build Vercel e testes locais aprovados. Esta auditoria não publicou alterações, não executou migrações e não alterou DNS, infraestrutura ou dados de produção.

O carregamento mobile passou de **85 para 97 pontos**, o LCP mediano caiu de **4,386 s para 2,416 s** e a transferência inicial caiu **59,4%**. As perguntas, alternativas, textos, ordem, destinos e identidade visual foram preservados. Isso comprova a melhoria no laboratório descrito abaixo; não comprova capacidade para milhares de visitantes simultâneos.

## A. Diagnóstico inicial

### Arquitetura encontrada

- Next.js/React na Vercel, com páginas públicas pré-renderizadas e APIs dinâmicas. Runtime principal Node.js 24.x e Turso.
- Uma jornada com 12 perguntas, preparação de sete segundos, apresentação do especialista, resumo e VSL. Há também recusa e página de obrigado.
- A API confirma cada gravação antes do avanço. Cookie HttpOnly identifica a sessão; respostas e primeiras visualizações são persistidas.
- Painel protegido por Better Auth, Sign in with Vercel, e-mail verificado e `ADMIN_EMAILS`.
- Sites/Cloudflare e a ponte da API constituem o legado preservado. Não são o destino desta otimização/deploy.

### Problemas comprovados

| Achado | Consequência inicial | Correção |
|---|---|---|
| Dois scripts e uma playlist da VTurb eram pré-carregados no layout global | Cerca de 237 KB externos competiam com a abertura, mesmo antes de chegar ao vídeo | Preparar recursos no resultado; executar o embed na VSL |
| CSS gerado a partir de fontes excessivamente abrangentes | 187.264 bytes de CSS bruto | Escopo explícito das telas/componentes usados |
| Componentes genéricos de UI no caminho público | Código de controles e utilitários além do necessário para o quiz | Controles nativos com aparência e interação equivalentes |
| Fotos WebP e intervalos grandes no `srcset` | O mobile medido baixava a foto de 960 px/178.522 bytes | AVIF e cinco larguras, com WebP preservado |
| Fetch público sem prazo máximo | Uma resposta que não terminasse podia manter o quiz bloqueado | Timeout, erros normalizados e nova tentativa explícita |
| Comparação de etapa sem revisão enviada pelo novo cliente | Uma aba atrasada podia retornar à mesma etapa após outra edição | Revisão explícita, CAS e recuperação com snapshot |
| Leitura separada de sessão e respostas | Possibilidade de um snapshot combinar estados de instantes diferentes | Um único SELECT com LEFT JOIN |
| Três consultas sequenciais de pré-requisitos nas etapas finais | Viagens adicionais ao banco | Um SELECT com três subconsultas |
| Relatórios administrativos usando batch de escrita | Reserva desnecessária de escritor para SELECTs | Batch de leitura no adaptador Turso |
| Corpo inteiro lido antes da validação e logs com detalhes de erros | Limites tardios e possibilidade de conteúdo sensível nos logs | Limite durante streaming e logs com campos permitidos |
| Dependências com advisories conhecidos | Audit inicial: 1 crítico, 6 altos, 6 moderados | Atualizações compatíveis e registro preciso do risco residual |

## B. Alterações implementadas

### Entrega e renderização

- `app/layout.tsx` e `components/vturb-resources.tsx`: retirado o preload global. O marcador `_plt` foi preservado. O aquecimento é idempotente e começa na etapa de resultado; o player continua sendo inicializado na VSL.
- `components/quiz-controls.tsx`: Button, Progress e radios nativos para a jornada pública. Foram preservados estados desabilitados, foco, indicação de seleção, navegação por teclado e confirmação explícita pelo botão Continuar quando se usa teclado. Os componentes genéricos permanecem disponíveis para o painel e o legado.
- `components/quiz-photo.tsx`, `lib/content.ts` e `scripts/optimize-quiz-images.mjs`: fotos em AVIF, qualidade 65, esforço 6 e chroma 4:4:4; larguras 576/768/960/1152/1536. Originais e WebPs mantidos. O `picture` seleciona uma única imagem compatível; não foram observados downloads simultâneos de AVIF e WebP na abertura final.
- `public/tiago-gomes/images/optimized/`: nomes com hash de conteúdo permitem cache longo sem sobrescrever um recurso publicado. Nas larguras com comparação equivalente, AVIF economiza 31,8% a 37,4% frente ao WebP.
- `next.config.ts`: AVIFs versionados recebem `public, max-age=31536000, immutable`; `/assets/` recebe `public, max-age=3600, stale-while-revalidate=86400`. As APIs continuam sem cache. A raiz de tracing do build foi explicitada.
- `app/globals.css`: fontes do Tailwind limitadas aos componentes efetivamente usados. CSS final: **79.057 bytes bruto / 16.268 gzip**, contra **187.264 / 30.943**. A inspeção dos imports transitivos incluiu painel, obrigado e aliases legados.
- `components/processing-step.tsx`: a animação de preparação atualiza apenas seu componente a cada 80 ms. Duração de sete segundos, mensagens e comportamento preservados. `components/quiz-cta.tsx` centraliza o controle visual do CTA.
- `app/page.tsx`: aquecimento da foto seguinte durante a preparação e do banner durante a história; controle de seleção por eventos e pela recuperação da sessão.

### Persistência, falhas e concorrência

- `lib/journey-client.ts`: prazo de **20 segundos**, incluindo leitura do corpo, com AbortController; distingue conexão indisponível, timeout e resposta inválida. Não repete automaticamente gravações que podem ter sido confirmadas pelo servidor.
- `app/api/journey/route.ts`: `expectedRevision` validada, respostas com a revisão confirmada e conflitos 409 com o estado atual. Mantidos `expectedStep`, comparação condicional no banco e transações. Clientes legados continuam aceitos.
- `lib/journey-snapshot.ts`: leitura única de sessão, revisão e alternativas. GET, retomada e conflitos passam de duas consultas para uma.
- As verificações de respostas completas, aceite e tempo de preparação usam uma chamada SQL consolidada nas etapas finais. As subconsultas continuam existindo: isso reduz viagens ao banco, não elimina as leituras lógicas necessárias.
- `lib/libsql-d1.ts`, `lib/database.ts` e `app/api/admin/route.ts`: relatórios usam transação de leitura. Escritas mantêm batch transacional. O adaptador D1 legado continua compatível.
- `lib/request-body.ts`: limite efetivo de **2.048 bytes**, com ou sem Content-Length, cancelamento de leitura excessiva e decodificação UTF-8 correta.
- `lib/backend-log.ts`: registra evento fixo, nome/código conhecido e status numérico; exclui mensagem, stack, causa, SQL, argumentos, cookies e tokens.
- `app/admin/dashboard.tsx`: resets de loading/detalhe nos eventos correspondentes e descarte de respostas após cancelamento. Filtros, paginação e proteção de acesso preservados. Links de retorno usam Next Link com prefetch desabilitado.

### Dependências e ferramentas

Next e eslint-config-next foram de 16.3.4 para **16.4.3**. Sharp, Zod transitivo, ws e a cadeia tsx/esbuild receberam correções compatíveis, registradas no lockfile. Não foi usado `audit fix --force` nem downgrade incompatível do Drizzle.

As atualizações cobrem advisories publicados para [Next](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [use cache no Next](https://github.com/advisories/GHSA-673q-mjm6-r5xr), [Sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) e [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). A presença de uma versão afetada não foi tratada como prova de exploração neste quiz.

Lighthouse foi instalado apenas em `outputs/perf-tools`, fora das dependências e do deploy da aplicação. Foram acrescentados testes de cliente, corpo, logs, navegador, resiliência, player, comparação visual e carga limitada. `eslint.config.mjs` exclui diretórios de artefatos locais. O bloco adicional em `AGENTS.md` foi gerado pelo Next atualizado.

## C. Comparação de performance

### Método e ambiente

- Build de produção local, servidor `http://localhost:5190`, Windows, Node 24.15.0, Chrome 156 e Lighthouse **13.6.0**.
- Backend local ligado explicitamente ao **Turso TEST**, com `VERCEL_ENV=development`. Não foi usado banco de produção.
- Três execuções mobile sequenciais e uma desktop por fase, com perfis isolados e novos. Valores mobile da tabela são medianas das três execuções, não a melhor execução.
- Mobile: 412 × 823, DPR 1,75, RTT simulado de 150 ms, 1.638,4 Kbps e CPU 4×. Desktop: 1350 × 940, DPR 1, RTT 40 ms, 10.240 Kbps e CPU 1×.
- Sem bloquear scripts, requests, imagens ou tracking no Lighthouse. Builds, testes de navegador e carga não rodaram em paralelo com essas medições.
- As medições incluem compressão HTTP local e transferência informada pelo Lighthouse. Não medem distância do visitante à CDN, cold starts da Vercel, Safari real ou distribuição de usuários reais.

| Indicador mobile | Antes | Depois final | Variação |
|---|---:|---:|---:|
| Lighthouse Performance | 85 | 97 | +12 pontos |
| LCP | 4.385,61 ms | 2.416,15 ms | −44,9% |
| INP de usuários reais | Não medido | Não medido | Não disponível |
| TBT, métrica de bloqueio em laboratório | 78 ms | 100,96 ms | +22,96 ms |
| CLS | 0 | 0 | Sem mudança |
| FCP | 909,67 ms | 912,15 ms | +2,48 ms |
| JS inicial transferido, incluindo terceiros | 412.524 bytes | 150.021 bytes | −63,6% |
| JS inicial do próprio site transferido | 175.912 bytes | 150.021 bytes | −14,7% |
| Total transferido | 628.990 bytes | 255.430 bytes | −59,4% |
| Requisições na abertura | 20 | 13 | −35,0% |
| CSS transferido | 31.343 bytes | 16.652 bytes | −46,9% |
| TTFB modelado pelo Lighthouse | 455 ms | 456 ms | +1 ms |
| Acessibilidade automatizada | 100 | 100 | Sem mudança |
| Boas práticas automatizadas | 100 | 100 | Sem mudança |

**O TBT não melhorou.** A mediana aumentou cerca de 23 ms e permaneceu abaixo de 200 ms nessas execuções. Não foi escondida essa variação, nem foi apresentado TBT como se fosse INP. FCP e TTFB ficaram próximos do baseline. A resposta observada do servidor em loopback teve mediana de 3 ms antes e 7 ms depois, com 102 ms na primeira medição final; não corresponde ao TTFB de produção.

| Execução mobile | Performance antes/depois | LCP antes/depois | TBT antes/depois |
|---|---|---|---|
| 1 | 89 / 97 | 3.628,74 / 2.444,03 ms | 111 / 116,49 ms |
| 2 | 85 / 97 | 4.385,61 / 2.416,15 ms | 43 / 100,96 ms |
| 3 | 84 / 97 | 4.419,24 / 2.407,62 ms | 78 / 96,60 ms |

No desktop, a execução foi de **100 para 100**, LCP de **688,55 para 526,87 ms**, CLS zero e TBT zero.

O navegador final escolheu a foto AVIF de **768 px / 83.232 bytes**, frente à WebP de **960 px / 178.522 bytes** no baseline. A redução resulta de formato e seleção de resolução apropriada. A foto não foi removida, ocultada ou substituída por um placeholder para melhorar a nota.

Uma fase intermediária, antes dos tamanhos 768/1152, teve 96/97/96 pontos e 289.814 bytes transferidos. Foi mantida como evidência; a nova fase foi motivada pela escolha comprovada de uma imagem maior do que a necessária, não por repetição para selecionar uma nota favorável.

Evidências agregadas e portáveis: [benchmarks/performance-2026-10-29.json](benchmarks/performance-2026-10-29.json). Relatórios HTML/JSON brutos locais: `outputs/performance/before`, `after-lighthouse` e `final-lighthouse`.

## D. Integridade do quiz

| Verificação | Resultado e alcance |
|---|---|
| Conteúdo | Comparação profunda com o baseline: iguais após excluir apenas os dois novos campos AVIF. `CONTENT_VERSION`, 12 perguntas, 51 alternativas, IDs, textos e ordem preservados |
| Fluxo completo | Abertura, todas as perguntas, preparação, história, resultado, VSL e destino de checkout aprovados |
| Respostas e validações | Todas as 51 alternativas válidas, opções inválidas, passos indisponíveis e origem indevida exercitados na API |
| Ramificações | Aceite e recusa, persistência da recusa, abas concorrentes, edição histórica permitida e isolamento entre visitantes aprovados |
| Retomada | Reload mantém etapa e respostas; snapshot coerente mesmo quando outra conexão grava entre a consulta e a resposta do SDK |
| Concorrência | Stale tab, retorno à mesma etapa com revisão antiga, gravações simultâneas e confirmação perdida aprovados; sem sobrescrita silenciosa |
| Falhas | 503, offline, JSON/HTML inválido, clique duplo, retry explícito e timeout real de 20,352 s aprovados |
| Teclado | Tab, setas, Space e Continuar preservam seleção e envio explícito. Clique direto no radio permanece marcado durante envio/falha |
| Vídeo indisponível | Checkout continua disponível quando VTurb é bloqueada; falha no registro do CTA não dispara navegação indevida |
| Vídeo real | Script HTTP 200, custom element e vídeo carregados; reload reinicializa; um script por montagem. Player medido em 375 px: 341,25 × 606,67 px |
| Checkout | URL exata `https://pay.kiwify.com.br/14n3TC2?src=gula`, interceptada no teste; nenhuma compra realizada |
| Responsividade | 16 estados × 7 larguras: 320, 375, 390, 412, 430, 768 e 1280 px. Sem overflow horizontal, CTA fixo dentro da tela e geometria preservada |
| Formulários | Não há formulário público de nome, telefone ou e-mail. Controles de respostas foram testados; nenhum campo foi removido |
| Administração | API anônima retorna 401; cache privado desabilitado. Better Auth, OAuth Vercel, verificação de e-mail e allowlist mantidos. Não se simulou login autorizado em produção |
| Obrigado e legado | Rotas principal/alias retornam 200. Aula pendente e botão de afiliação oculto preservados; testes da ponte aprovados sem acesso remoto |

Foram capturadas e comparadas **112 telas**, com as mesmas medidas de headline, largura e CTA. **91 capturas ficaram idênticas pixel a pixel**, incluindo todas as 84 capturas das perguntas e as sete do resultado. As demais diferenças finais estão nas 14 fotografias reencodadas, nos sete quadros/overlays do vídeo e numa variação de 1/255 em 80 pixels fora do player em 390 px. A comparação não mascara essas regiões; elas foram revisadas visualmente. Evidências finais: `outputs/performance/after-final/browser` e `outputs/performance/visual-comparison-final.json`.

O teste de resiliência final passou em nove cenários, sem erros de página/hidratação. O teste de API passou integralmente em 67,661 segundos. Durante a validação, uma falha de configuração local da URL do Better Auth foi corrigida **somente na variável do processo de teste**; nenhuma proteção ou lista de hosts de produção foi flexibilizada.

Build `npm run build:vercel`, TypeScript e testes dos helpers passaram. ESLint terminou sem erros; permanecem duas advertências `no-img-element` para os banners WebP já pré-otimizados, dimensionados e com `srcset`. Elas não foram escondidas por uma desativação global da regra.

### Rastreamento preservado e seus limites

- `sessions`: UUID, versão do conteúdo, entrada, início, revisão/última atividade, etapa atual/máxima, chegada à apresentação, primeiro clique, origem e dispositivo.
- `answers`: alternativa atual e horário por sessão/pergunta. Edição válida mantém a regra histórica de valer a resposta mais recente.
- `step_views`: primeira chegada por sessão/etapa, sem duplicação em reload.
- `cta_clicked_at`: primeiro clique confirmado, preservado por COALESCE. Clique não é confirmação de compra.
- `utm_source` continua sendo a única UTM persistida como `source`; a retomada mantém a origem inicial. `device` usa a largura inicial de 768 px como corte.
- **Limitação preexistente:** outras UTMs, `gclid`, `fbclid`, `ttclid` e equivalentes não são persistidos nem encaminhados pelo código ao checkout. Não foram inventados campos nem modificados os parâmetros comerciais aprovados.
- Não foram encontrados pixels próprios Meta/Google/TikTok, GA, GTM, CRM, webhook de pagamento ou evento próprio de compra. Configurações dentro das contas VTurb/Kiwify não foram auditadas. O carregamento e o marcador da integração VTurb existente foram preservados.

## E. Escalabilidade observada

Teste limitado contra o servidor local e Turso TEST: três rodadas sequenciais, 12 visitantes por rodada, pausa de 100 ms entre respostas, sem retries. Cada visitante inicializou, iniciou, respondeu às 12 perguntas e conferiu o estado salvo. A carga parou antes da VSL.

| Visitantes concorrentes | Visitantes concluídos | Requisições | Erros | Duração | p50 | p95 | p99 | Req/s observadas |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 12/12 | 180 | 0 | 66,328 s | 284,15 ms | 353,20 ms | 546,02 ms | 2,71 |
| 3 | 12/12 | 180 | 0 | 22,347 s | 283,54 ms | 334,64 ms | 660,71 ms | 8,05 |
| 5 | 12/12 | 180 | 0 | 16,794 s | 282,98 ms | 375,38 ms | 806,33 ms | 10,72 |

**Total: 36 visitantes, 540 requisições, zero erros.** Todas as 12 respostas foram conferidas por visitante. As sessões de QA foram preservadas no TEST. Os números incluem a rede desta máquina até o banco de testes; não medem a implantação distribuída.

Contagem estática do caminho completo de um visitante novo, sem retomada/retry:

| Operação | Antes | Depois |
|---|---:|---:|
| POSTs de jornada | 18 | 18 |
| Chamadas ao SDK do banco | 44 | 38 |
| Instruções SQL da aplicação, sem BEGIN/COMMIT | 73 | 67 |
| Consultas por GET de sessão existente | 2 | 1 |
| Consultas por init de retomada | 2 | 1 |

Não foram reduzidos eventos persistidos para obter esses números. As respostas continuam aguardando confirmação do servidor, com seleção e estado de envio imediatos na interface. Sua latência segue dependente de rede e banco; não se promete transição de zero milissegundos.

Este teste **não comprova capacidade máxima**, milhares de usuários, autoscaling da Vercel, CDN sob pico ou limites do Turso. Isso exige ambiente de carga representativo, limites aprovados, telemetria de funções/banco e orçamento conhecido. Não foi realizado teste agressivo contra produção.

## F. Problemas pendentes e limites reais

| Item | Estado e impacto |
|---|---|
| INP/RUM/CrUX e p75 real | Não medidos. A nota local e TBT não substituem a experiência de usuários reais |
| TBT | Aumentou cerca de 23 ms na mediana; acompanhar CPU e interações em aparelhos reais. Não foi identificado travamento funcional nos cenários testados |
| Escala de produção e WAF | Sem teste em grande escala nem verificação das regras externas. Não existe limitador distribuído na API pública; o rate limit padrão de autenticação é por memória da instância |
| Crescimento do painel | Agregações por período e OFFSET permanecem. Índice composto ou paginação por cursor exigem EXPLAIN, volume real e tarefa de migração própria |
| Segurança residual da árvore instalada | `npm audit --omit=dev`: 0 críticos, 0 altos, 4 moderados, representando uma cadeia de um advisory do esbuild; explicação abaixo |
| Perda da primeira resposta de init | Se o navegador nunca receber o Set-Cookie após o INSERT, uma tentativa manual pode criar uma sessão órfã adicional. Situação preexistente; não foi inventada identidade persistente nova |
| Cliente legado | Chamadas sem `expectedRevision` mantêm compatibilidade e o CAS anterior, mas não recebem toda a proteção nova contra retorno à mesma etapa |
| Atribuição completa de anúncios | Apenas utm_source existe no código atual. O desenho de captura das demais UTMs/click IDs e integração de compra continua pendente de definição |
| Obrigado | Vídeo e tempo de liberação ainda não fornecidos; botão de afiliação permanece oculto. Abrir essa página não comprova pagamento |
| Aparelhos e browsers reais | Responsividade/teclado medidos no Chrome e emulação de larguras; Safari/iOS e Android físicos não foram executados. WebP continua como fallback ao AVIF |
| Login autorizado e legado completo | Não foi realizado OAuth real no ambiente de produção nem rebuild/deploy completo do Sites histórico. Proteção, rotas, adaptador e ponte foram verificados no escopo local |

Os quatro moderados são a cadeia `drizzle-kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils → esbuild 0.18.20`, relacionada ao [servidor de desenvolvimento esbuild.serve](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99). Drizzle Kit também é peer opcional do Better Auth; portanto não é correto afirmar que `--omit=dev` necessariamente o remove. A inspeção dos **16 traces, com 3.495 referências**, e do JS de servidor gerado não encontrou essa cadeia no runtime rastreado. O aplicativo não usa `esbuild.serve()`. Evitou-se forçar downgrade/override incompatível apenas para zerar o contador. Atualizar essa cadeia quando houver versão compatível e nunca expor o servidor de desenvolvimento do esbuild.

## G. Recomendações para produção e reprodução

### Publicação posterior

1. Revisar esta branch e validar um Preview no projeto existente `rota-do-dolar`, equipe `tiagogomezdigitals-projects`, ID `prj_KAvkO4bfBTr7wFbOPhWiRw0Qa2cW`.
2. Conferir conta, revisão, branch e variáveis antes de qualquer operação remota. Preview/Development exigem `QUIZ_TEST_TURSO_*`; produção usa suas variáveis já existentes. Não copiar credenciais para arquivos versionados.
3. Usar Node.js 24.x, lockfile com `npm ci` e `npm run build:vercel`. Não executar schema/importação durante instalação ou build.
4. Conferir os headers no Preview e, após autorização, na produção. Manter cache longo somente nos recursos com hash e `no-store` nas APIs privadas/de sessão.
5. O push em `main` publica automaticamente pela integração Git. **Esta auditoria não fez push em main nem deploy.** Não é necessário recriar o projeto Vercel ou trocar DNS.

### Operação antes de ampliar tráfego

- Acompanhar erros 5xx, conflitos 409, timeouts de gravação, latência p50/p95/p99, falhas de vídeo e proporção entre início, apresentação e clique. Preservar a distinção entre clique e compra.
- Verificar métricas e limites de funções Vercel, uso/latência do Turso e regras WAF existentes. Definir proteção contra abuso considerando também a ponte legada; não adicionar bloqueio baseado em IP que quebre tráfego legítimo sem observação.
- Colher LCP/INP/CLS por dispositivo e conexão em produção usando a infraestrutura de monitoramento aprovada. Não foram adicionados pixels, SDKs pagos ou telemetria com dados pessoais nesta auditoria.
- Aumentar carga por etapas em ambiente representativo, com critérios de parada e orçamento. Os 5 visitantes concorrentes deste teste são um ponto de verificação funcional, não dimensionamento de campanha.
- Manter a revisão anterior disponível na Vercel para rollback. Não houve mudança de schema, conteúdo versionado ou autenticação que exija migração para esta entrega.

### Reproduzir localmente

As variáveis Development devem estar configuradas sem exibir valores. Para o servidor da build local em PowerShell:

```powershell
npm ci
npx tsc --noEmit --incremental false
npm run build:vercel
$env:VERCEL_ENV='development'
$env:BETTER_AUTH_URL='http://localhost:5190'
node scripts/run-vercel.mjs start -p 5190 -H 127.0.0.1
```

Em outro terminal, aponte para **localhost**, configure o Playwright/Chrome disponíveis e execute apenas contra o banco TEST:

```powershell
$env:QUIZ_TEST_ORIGIN='http://localhost:5190'
$env:QUIZ_CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
# QUIZ_PLAYWRIGHT_MODULE pode apontar para o index.mjs de um Playwright já instalado.
node scripts/check-quiz.mjs
node scripts/check-quiz-browser.mjs revisao --confirm-test-database
node scripts/check-quiz-browser-resilience.mjs --confirm-test-database
node scripts/check-quiz-player.mjs --confirm-test-database
node scripts/check-quiz-load.mjs --confirm-test-database --visitors=12 --concurrency=3
```

Execute Lighthouse separadamente, sem carga, navegador de testes ou build concorrentes:

```powershell
npm install --prefix outputs/perf-tools --no-save --package-lock=false lighthouse@13.6.0
node scripts/measure-quiz-performance.mjs --phase nova-medicao --url http://localhost:5190/ --confirm-test-db
```

O runner recusa fase não vazia e URL remota. A comparação visual usa `scripts/compare-quiz-visuals.mjs`, com caminhos `--before`, `--after` e `--out`. Helpers sem servidor e demais comandos estão no README.

Artefatos brutos, perfis isolados e capturas ficam em `outputs/`, ignorado pelo Git e pelo deploy. O JSON agregado deste relatório contém somente métricas técnicas, sem cookies, tokens, respostas de visitantes ou IDs de sessões.
