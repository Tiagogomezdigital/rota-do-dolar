# Rota do Dólar

Landing page exclusiva com uma jornada de 12 perguntas, apresentação do especialista, resultado e VSL. O visitante pode retomar o progresso e revisar escolhas. O painel administrativo reúne respostas, funil e percursos individuais.

## Produção

- Código privado: [Tiagogomezdigital/rota-do-dolar](https://github.com/Tiagogomezdigital/rota-do-dolar).
- Site público: [rotadodolar.com.br](https://rotadodolar.com.br/) e [www.rotadodolar.com.br](https://www.rotadodolar.com.br/).
- Painel restrito: [rotadodolar.com.br/admin](https://rotadodolar.com.br/admin).
- Vercel: equipe `tiagogomezdigitals-projects`, projeto `rota-do-dolar`, ID `prj_KAvkO4bfBTr7wFbOPhWiRw0Qa2cW`.
- Aplicação: Next.js e React, com Node.js 24.x na Vercel.
- Banco: Turso. Produção, preview e desenvolvimento têm seleção de credenciais separada.

O painel usa Better Auth e Sign in with Vercel. Cada acesso exige e-mail verificado e presença em `ADMIN_EMAILS`. O site público não exige login. Sessões anônimas usam cookie HttpOnly; a aplicação não captura nome, telefone ou e-mail dos visitantes.

Este projeto é a landing page Rota do Dólar. O Supabase `quizFlow` pertence ao construtor anterior e não é o banco desta aplicação.

## Iniciar em outro computador

Clone o repositório privado com uma conta autorizada. Use Node.js 24.x e npm. Dentro do checkout:

```sh
npm ci
npx vercel@65.5.0 whoami
npx vercel@65.5.0 link --project rota-do-dolar --scope tiagogomezdigitals-projects
npx vercel@65.5.0 project inspect --scope tiagogomezdigitals-projects
npx vercel@65.5.0 env pull .env.local --environment development --scope tiagogomezdigitals-projects
npm run dev:vercel
```

Antes de vincular ou buscar variáveis, confira que a conta tem acesso à equipe correta. O projeto inspecionado deve ter o ID informado acima. Se faltar acesso, autentique uma conta autorizada; não crie outro projeto como substituto. A aplicação local abre em `http://localhost:5173`.

As variáveis vêm do ambiente **Development** da Vercel. `.env.local` e `.vercel/` ficam ignorados pelo Git. Não copie credenciais para o README, código, mensagens ou arquivos versionados. Use [.env.example](.env.example) apenas como catálogo de nomes.

| Finalidade | Variáveis |
| --- | --- |
| Runtime e login | `QUIZ_RUNTIME`, `VERCEL_CLIENT_ID`, `BETTER_AUTH_SECRET`, `ADMIN_EMAILS` |
| Banco de produção | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| Banco de preview e desenvolvimento | `QUIZ_TEST_TURSO_DATABASE_URL`, `QUIZ_TEST_TURSO_AUTH_TOKEN` |

O runtime fora de produção exige as variáveis `QUIZ_TEST_TURSO_*` e não usa o banco principal como fallback. Mesmo que outras credenciais estejam disponíveis na integração, mantenha esse isolamento. O banco de testes existente já possui o esquema necessário; iniciar outro checkout não exige importar respostas nem recriar recursos.

## Conteúdo e comportamento

O conteúdo editável fica em `lib/content.ts`. O [roteiro de implementação](docs/roteiro-2026-10-23.md) registra a ordem das telas e as decisões aprovadas. Preserve IDs de perguntas e alternativas. Mudanças semânticas precisam de uma nova `CONTENT_VERSION` para não misturar análises históricas.

A montagem de viagens, família, carro e trabalho é ilustrativa. As notificações e gráficos não são resultados comprovados. As frases comerciais fixas não são métricas extraídas do painel. Não introduza promessas, depoimentos ou contagens inventadas.

Permanecem anotados para solicitar:

- Link ou código da VSL principal e minuto/segundo exatos do pitch para liberar o checkout.
- Link ou código do vídeo de obrigado e minuto/segundo para liberar a afiliação.
- Foto real de Tiago com Karen e Maluzinha.

Os botões correspondentes ficam ocultos enquanto faltam vídeo e tempo. A liberação deve acompanhar a reprodução real do vídeo, conforme o roteiro. Abrir a página de obrigado não comprova pagamento.

## Validação e publicação

Para conferir tipos e build da aplicação Vercel:

```sh
npx tsc --noEmit --incremental false
npm run build:vercel
```

Use os testes existentes conforme a alteração. `scripts/check-video-progress.mjs` verifica a liberação por reprodução e `scripts/check-libsql-adapter.mjs` usa SQLite temporário local. `scripts/check-quiz.mjs` precisa de servidor local com o banco TEST e grava sessões de QA nesse ambiente. Não aponte testes de gravação para produção.

Após concluir o vínculo GitHub/Vercel, pushes na ramificação de produção podem publicar automaticamente. Confira a configuração Git do projeto antes de enviar alterações. Use uma ramificação de trabalho e preview quando a mudança precisar de revisão. As variáveis e integrações existentes são mantidas na Vercel; não adicione tokens de deploy ao repositório.

O fluxo principal usa `dev:vercel`, `build:vercel` e `start:vercel`. Os scripts genéricos `dev`, `build` e `start` foram preservados para o runtime Sites antigo e não são o fluxo principal desta hospedagem. A operação detalhada está em [docs/vercel.md](docs/vercel.md).

## Dados e origem antiga

As tabelas do quiz são `sessions`, `answers` e `step_views`; o login usa tabelas `auth_*`. Gravações condicionais e transações protegem respostas de abas concorrentes. Vale a resposta mais recente após uma revisão explícita; clique no checkout não é compra confirmada.

O domínio principal foi migrado para a Vercel. A origem Sites e o D1 histórico continuam preservados para recuperação e links antigos. A ponte da API antiga encaminha novas gravações ao Turso atual. Não desative essa ponte por limpeza de código, nem publique somente no Sites esperando atualizar o domínio principal.

Scripts de esquema, importação e migração não são etapas de instalação de um checkout. Não os execute automaticamente. Backups, respostas de visitantes, cookies, credenciais e artefatos de runtime devem permanecer fora do Git e do pacote de deploy.
