# IOR · Gestão Pro

Sistema de gestão completo para o Instituto de Reflexologia e Pesquisa (IOR). Gerencia alunos, cursos, CRM de leads, financeiro, checklist, lembretes WhatsApp e painel pedagógico.

## Run & Operate

- `pnpm --filter @workspace/ior-gestao run dev` — frontend (porta dinâmica via PORT)
- `pnpm --filter @workspace/api-server run dev` — API server (porta 8080)
- `pnpm run typecheck` — typecheck completo de todos os pacotes
- `pnpm run build` — build completo

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + recharts (sem Tailwind no componente principal)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (não utilizado pelo frontend ainda — dados em memória)
- Build: esbuild (CJS bundle para API)

## Where things live

- `artifacts/ior-gestao/src/IOR.jsx` — componente principal (todo o SaaS em um arquivo)
- `artifacts/ior-gestao/src/App.tsx` — entry point que monta o IOR
- `artifacts/api-server/src/routes/` — rotas da API
- `lib/api-spec/openapi.yaml` — contrato da API

## Architecture decisions

- O componente IOR.jsx é um SPA monolítico com state interno (useState), sem backend externo — dados seed em memória.
- Roteamento feito via `page` state interno (sem React Router/wouter no SaaS).
- CSS injetado via componente `<GS/>` (tag `<style>` no DOM) com variáveis CSS.
- Recharts para gráficos de barras e linhas no dashboard e financeiro.
- App responsivo com sidebar desktop + bottom nav mobile.

## Product

- Dashboard com receita total, leads em aberto, gráfico de vendas por tipo
- CRM de Leads com kanban e lista, conversão automática para aluno
- CRM de Produtos com pipeline de pedidos
- Gestão de Alunos com controle de parcelas e WhatsApp
- Cursos & Calendário com lista de espera
- Financeiro com vendas, gráfico e metas
- Checklist com SLA por prioridade
- Lembretes WhatsApp com modelos
- Painel Pedagógico por aluno
- Permissões por perfil de acesso

## User preferences

- Aplicativo em português (Brasil)
- Layout com tema claro, fontes Playfair Display + DM Sans

## Gotchas

- O arquivo IOR.jsx não deve ser convertido para TSX (ficaria com erros de type devido ao CSS inline complexo)
- Dados são em memória — ao recarregar a página os dados seed são restaurados

## Pointers

- Ver skill `pnpm-workspace` para estrutura do monorepo
