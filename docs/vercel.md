# Hospedagem do Rota do Dólar

O mesmo código suporta a origem Sites existente e Next.js na Vercel. A migração preserva a copy, as etapas e todas as edições históricas das respostas.

## Projeto Vercel

- Equipe: `tiagogomezdigitals-projects`.
- Projeto: `rota-do-dolar`.
- Node.js: 24.x no projeto hospedado.
- Build: `npm run build:vercel`.
- Desenvolvimento local: `npm run dev:vercel`.

Antes de qualquer operação remota, confira a identidade do CLI e o projeto vinculado. Credenciais e arquivos `.env.local` permanecem ignorados pelo Git. O conector Vercel de outra conta não deve ser usado para modificar este projeto.

## Banco

Turso Starter em `iad1`, próximo às funções da aplicação. Produção usa `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`. Preview e desenvolvimento exigem `QUIZ_TEST_TURSO_DATABASE_URL` e `QUIZ_TEST_TURSO_AUTH_TOKEN`, sem fallback para o banco principal.

As tabelas do quiz continuam sendo `sessions`, `answers` e `step_views`. As operações de avanço e edição mantêm a mesma transação e comparação de revisão do D1. As tabelas de autenticação têm prefixo `auth_`.

Os scripts de importação exigem um arquivo de ambiente explícito para operações de migração. Backups contêm dados privados, ficam fora deste repositório e não devem ser enviados ao deploy. `scripts/import-quiz-data.mjs` verifica todos os campos, chaves e métricas. Por padrão, contagens adicionais interrompem a verificação. Quando há visitas novas legítimas no destino, a opção `--allow-extra-target-rows` preserva essas visitas e ainda confere cada registro do snapshot. Nenhum importador apaga dados existentes.

## Painel

O painel usa Better Auth e Sign in with Vercel com PKCE. A identidade do projeto autentica a troca de código por OIDC, sem um client secret OAuth permanente. O aplicativo exige e-mail verificado e presença exata em `ADMIN_EMAILS` em cada acesso administrativo. Headers de identidade do Sites não autenticam visitantes na Vercel.

Variáveis adicionais: `QUIZ_RUNTIME=vercel`, `VERCEL_CLIENT_ID` e `BETTER_AUTH_SECRET`. Configure segredos diferentes entre produção e testes. O callback é `/api/auth/callback/vercel` e precisa estar cadastrado no aplicativo Vercel. A origem dinâmica aceita somente os domínios exatos configurados.

## Transição da origem antiga

A origem Sites mantém seu login nativo e D1 enquanto as flags de migração estiverem ausentes. O build Sites deve executar sem `QUIZ_RUNTIME=vercel` e sem `VERCEL=1` no ambiente de build.

`JOURNEY_WRITE_PAUSED=1` na origem Sites permite uma pausa curta de gravações antes do snapshot final. `JOURNEY_FORWARD_ORIGIN=https://rota-do-dolar-beige.vercel.app` encaminha somente a API pública de progresso ao novo banco e tem precedência sobre a pausa. O encaminhamento mantém cookies e respostas, não segue redirects e falha sem gravar no D1 se o destino estiver indisponível. Essas flags são ignoradas na Vercel.

Valide login, dados e aplicação antes de mudar DNS. Refaça o snapshot com gravações pausadas, verifique a importação e habilite a ponte antes de alterar somente os apontamentos web. Preserve TXT, SPF e a configuração de e-mail existente. O site antigo e os backups devem continuar disponíveis para recuperação.
