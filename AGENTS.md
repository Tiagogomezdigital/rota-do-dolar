# Instruções para trabalhar neste repositório

Este checkout contém a landing page **Rota do Dólar**. Não é o construtor QuizForge nem o projeto Empresa TGS. Trabalhe nesta pasta e não altere outros projetos para resolver tarefas deste quiz.

## Antes de editar

Leia `README.md` e `docs/vercel.md`. Para mudanças em copy, telas, vídeos ou oferta, leia também `docs/roteiro-2026-10-23.md`. Preserve a jornada aprovada, as 12 perguntas, a disposição responsiva e o CTA visível na abertura, salvo alteração solicitada pelo usuário.

O conteúdo fica em `lib/content.ts`. Preserve IDs de perguntas e alternativas; mudanças semânticas exigem avaliar uma nova `CONTENT_VERSION`. Não invente resultados financeiros, depoimentos ou métricas. Não insira travessões nas copys. Os materiais ainda pendentes estão registrados no roteiro e no painel; não preencha links ou tempos de vídeo por suposição.

A cópia independente `/daniel` tem conteúdo em `lib/content-daniel.ts` e imagens em `public/daniel/`. Edite somente a variante solicitada. Os componentes são compartilhados; mantenha cookies, versões de conteúdo e relatórios separados. A cópia usa o mesmo banco e a mesma proteção administrativa, sem migrar respostas existentes.

## Ambiente correto

- Repositório privado: `Tiagogomezdigital/rota-do-dolar`. Preserve este proprietário ao configurar Git e publicação.
- Produção: `https://rotadodolar.com.br/` e `https://www.rotadodolar.com.br/`.
- Equipe Vercel: `tiagogomezdigitals-projects`.
- Projeto Vercel: `rota-do-dolar`, ID `prj_KAvkO4bfBTr7wFbOPhWiRw0Qa2cW`.
- Runtime principal: Next.js na Vercel, Node.js 24.x, Turso.
- O Supabase `quizFlow` é de outro projeto. Não o modifique para tarefas deste quiz.

Antes de operações remotas, confira a conta autenticada, equipe, projeto, revisão e ambiente. Acesso a outro projeto ou outra conta não autoriza publicar ali. Se o CLI não tiver acesso ao projeto correto, resolva a autenticação; não recrie recursos como alternativa. O conector Vercel disponível no ambiente pode estar ligado a outra conta, portanto verifique sua identidade antes de usá-lo para mutações.

Use `npm ci`, `npm run dev:vercel` e `npm run build:vercel` para o fluxo principal. Busque somente as variáveis de Development para o trabalho local. Preview e desenvolvimento exigem `QUIZ_TEST_TURSO_*`, sem fallback para `TURSO_*` de produção. Não adapte o runtime para usar o banco real em testes.

## Proteção de acesso e dados

O site é público e `/admin` permanece restrito. Preserve Better Auth, Sign in with Vercel, e-mail verificado e a allowlist `ADMIN_EMAILS` em cada operação administrativa. Headers de identidade do Sites não autenticam usuários na Vercel. Não reduza proteções para fazer um teste passar.

Nunca versione `.env*` com valores, `.vercel/`, `.dev.vars*`, tokens, cookies, respostas de visitantes, bancos, backups ou logs privados. `.env.example` contém apenas nomes e valores vazios. Preserve os ignores. Mantenha sessões, respostas, visualizações, UUIDs, datas e edições históricas existentes.

Não execute importadores, scripts de esquema, migrações ou alterações de DNS como rotina de instalação, build ou manutenção. Uma cópia antiga não deve sobrescrever progresso novo. Alterações nesses recursos exigem uma tarefa que realmente as inclua e conferência do estado atual.

## Publicação e legado

O GitHub está conectado à Vercel e `main` é a ramificação de produção. Um push em `main` inicia deploy automático. Confira a configuração Git e o escopo autorizado antes do push; não envie à produção apenas para experimentar.

Os scripts genéricos `dev`, `build` e `start`, as dependências Cloudflare e `.openai/hosting.json` atendem ao runtime Sites histórico. Não são a publicação principal. A origem antiga e o D1 foram preservados para recuperação; a ponte da API mantém links antigos gravando no banco atual. Não apague, desative ou republique esse legado por limpeza incidental.

## Validação

Faça verificações proporcionais à mudança e corrija falhas observadas. Para código, use a checagem TypeScript e o build Vercel. Para fluxo, banco ou vídeo, consulte os scripts atuais `check-quiz.mjs`, `check-libsql-adapter.mjs` e `check-video-progress.mjs` em `scripts/`. Testes que gravam exigem o servidor local e o banco TEST. Preserve transações, comparação de revisão, retomada de sessão e proteção de recusa entre abas.

Relate o que mudou, como foi verificado e qualquer limite real. Não declare publicação, vínculo Git ou migração concluídos apenas porque uma operação foi iniciada.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
