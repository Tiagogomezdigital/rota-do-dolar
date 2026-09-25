# Próximo Passo — landing page com dinâmica de quiz

Landing page específica para um único produto, com textos e mídia provisórios. Não é um construtor de quizzes.

## O que existe

- 17 estados: abertura, 12 perguntas, transição, especialista, resultado e proposta.
- Escolhas persistidas em D1 por sessão anônima identificada por cookie HttpOnly.
- Retomada após recarregar, voltar/alterar respostas, resultados iniciais por objetivo/experiência.
- `/admin`: conta ChatGPT + allowlist no servidor em `ADMIN_EMAILS`.
- Respostas agregadas, funil, métricas de início/conclusão/clique, período e detalhes individuais.
- CTA provisório registra interesse; não compra nem redireciona enquanto a URL não estiver configurada.

## Conteúdo e ativos

Editar `lib/content.ts`. Os textos são provisórios e identificados na interface. `hero.imageUrl` usa uma montagem ilustrativa de experiências, gerada com IA, com o rosto de Tiago Gomez baseado em referências do perfil público @eutiagogomez. As cenas de viagem, lazer e trabalho são conceituais; as notificações financeiras e o gráfico são exemplos ilustrativos, não resultados comprovados. `expert.imageUrl`, `offer.videoUrl` e `offer.checkoutUrl` ficam vazios até termos os materiais. IDs de questões/opções são estáveis: mudanças semânticas requerem uma nova `CONTENT_VERSION` para não misturar análises. As versões antigas permanecem no banco; este painel mostra a versão ativa.

## Medição

- Visita = uma sessão/navegador; não pessoa única.
- Início = avançou da abertura.
- Conclusão = abriu a proposta após as perguntas.
- Clique = primeiro clique no CTA da proposta por sessão; não é venda.
- Interrompido = iniciado, não concluído e sem atividade registrada há 30 minutos.
- Respostas e visualizações não se duplicam ao voltar. Vale a alternativa mais recente.
- O período filtra pela data de criação da sessão, em janela móvel de 24h/7d/30d ou todo o período.
- Informações individuais: opções, datas, dispositivo aproximado e UTM source. Não há captura de contatos ou IPs na aplicação.

## Desenvolvimento

Node >=22.13, npm. `npm run dev` (localhost:5173). O starter simula sign-in local com `seedy@sites.test`. `.dev.vars` e `.env` são locais e ignorados; não publicá-los. A allowlist hospedada é gerenciada em Sites e não deve incluir a conta de teste.

Migrations em `drizzle/`; a publicação as aplica ao D1 de produção. Use as instruções Sites para build e publicação. A versão hospedada inicia privada, apenas para o proprietário, até solicitação explícita para tornar a landing page pública. A proteção independente de `/admin` permanece necessária.

## Validação

`npx tsc --noEmit`; `python3 tests/integration.py` com prévia e D1 local inicializados. Testes cobrem autenticação, origem, validação de opções/etapas, persistência, isolamento de sessões, revisão sem duplicação, CTA idempotente e analytics.

WebMCP opcional: ferramenta read-only `read_quiz_stage`, compartilhando a etapa visível. Validação em contexto WebMCP não disponível nesta sessão; a funcionalidade principal não depende dela.
