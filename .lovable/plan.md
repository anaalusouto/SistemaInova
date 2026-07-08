# Plano de alterações — Project Financier Buddy

## Passo 0 — Sincronizar o projeto enviado

O ZIP contém a versão mais atualizada do sistema (React + TanStack Start, mesmo stack). O template atual do sandbox está praticamente vazio. Vou copiar toda a árvore `src/app/`, `src/components/`, `src/hooks/`, `src/lib/`, `src/styles.css` e `src/routes/index.tsx` do ZIP para `/dev-server`, mantendo `router.tsx`, `start.ts`, `server.ts`, `__root.tsx` e configs de build. Instalo dependências que faltarem (`sonner`, `recharts`, `zustand`, etc.).

## 1. Dashboard
- Remover botões **"+ Novo Projeto"** e **"Atualizar agora"** do `Dashboard.tsx`.
- Restante permanece igual (mexemos depois).

## 2. Projetos — reordenar abas dos módulos internos

Nova ordem em `ProjectView.tsx`:
1. **Cadastro** (primeiro)
2. **Monitoramento** (Visão Geral fundida aqui)
3. **Financeiro**
4. **Gestão de Risco**
5. **Gestão de Mudança**
6. **Evidências e Relatório**

### 2.1 Cadastro (`TabCadastro.tsx`)
- Adicionar campo **Código Interno** somente-leitura no formato `NN-AAAA` (ex.: `01-2026`), gerado pela ordem de criação do projeto no ano vigente. Persistir no store (`src/app/store.tsx`) — atribuir na criação, imutável depois.
- Manter Situação, Nome, Objetivo, Coordenador(A), Financiador/Organização, Equipe, Vigência e Financeiro.

### 2.2 Monitoramento (`TabMonitoramento.tsx` + funde `TabOverview.tsx`)
- Remover a aba Visão Geral separada; trazer o **resumo completo do projeto** para o topo do Monitoramento.
- Botão **"Ver detalhamento do monitoramento"** que expande / rola para o detalhamento.
- Cada **Atividade** do plano de ação deve estar **vinculada a uma Meta** (select obrigatório de meta ao criar/editar atividade).
- Todos os campos de metas/atividades **editáveis** (edit inline + diálogo). Ações registradas via sistema de auditoria (ver Config).
- Manter a lógica atual de adicionar metas/atividades.

### 2.3 Financeiro (`TabFinanceiro.tsx`)
- Envolver as listas de **Detalhamento** e **Contrapartidas** em `ScrollArea` (barra de rolagem) com altura máxima.
- Manter "+ Item Orçamentário" e demais funcionalidades.

### 2.4 Gestão de Risco / Mudança — manter.

### 2.5 Evidências e Relatório — manter (integrado à lógica de auditoria).

## 3. Diagnósticos (`DiagnosticoPage.tsx` + `diagnostic/store.tsx`)
- Cada projeto passa a ter seu próprio diagnóstico (chave `diagnostics[projectId]` no store). Seletor de projeto no topo da página.
- Questionário: manter como está.
- **Índice de Maturidade**: ao clicar/alterar/desfazer uma marcação exigir **login administrativo** (modal). Só desbloqueia com credenciais válidas.
- Cesta de Produtos e Resumo: manter.

## 4. Relatórios (`ReportsPage.tsx`)
- Substituir o "dashboard 2" atual por uma tela de **montagem de relatório**: checkboxes para escolher quais campos entram (Cadastro, Metas, Financeiro, Riscos, Mudanças, Diagnóstico, etc.), e um resumo unificado abaixo. Botão exportar (imprimir/PDF via `window.print`).

## 5. Configurações (`ConfiguracoesPage.tsx`)

### 5.1 Autenticação + tela de Login (nova)
- Nova tela de login antes de entrar no sistema. Estado de sessão em `localStorage`.
- **Dois usuários fixos** (sem cadastro):
  - Apresentação: `login: CRIA` / `senha: INOVA`
  - Administrador: `login: LJCRIA` / `senha: 12332145+`
- Admin pode tudo. Usuário `CRIA` também opera o sistema, mas ações sensíveis (desmarcar índice de maturidade, editar registros bloqueados) pedem re-autenticação administrativa.

### 5.2 Perfil
- Mostra dados do usuário logado + **log de atividade individual**: hora de acesso, áreas visitadas, ações (create/update/delete) — persistido em `localStorage` (`audit_log`).
- Cada mudança nas abas dispara `logAction({ user, area, action, target })`.

### 5.3 Notificações
- Painel parcialmente desenvolvido: lista de eventos (metas próximas do prazo, atrasos) com toggle "enviar por e-mail" (mock). Deixar comentado no código o ponto de integração de e-mail para o admin e cada login.

### 5.4 Segurança
- Concentra: registro de auditoria completo (todos os usuários), gestão de senhas (placeholder), alterar/editar equipe.

### 5.5 Perfil (visão individual) vs Segurança (edição)
- Em Perfil: somente visualização do próprio usuário.
- Em Segurança: edição de qualquer dado (inclusive equipe).

### 5.6 Equipe
- Mantém como "vitrine" (somente leitura em Configurações → Equipe). Edição fica em Segurança.

### 5.7 Categorias
- Avaliar necessidade. Manter por ora, mas dentro de um accordion recolhido — nota TODO para remover se não usada.

### 5.8 Organização
- **Remover** da navegação de Configurações.

## 6. Sistema de auditoria (transversal)
Criar `src/app/auth/authStore.tsx` (contexto de sessão) e `src/app/audit/auditStore.tsx` (log). Todas as chamadas de mutação nos stores existentes chamam `logAction`. Perfil e Segurança leem esse log.

## Detalhes técnicos

- Stack: React 19 + TanStack Start (mesmo do template). Sem backend — persistência via `localStorage` (já é o padrão do projeto enviado).
- Roteamento: mantemos a rota única `/` + `AppShell` interno, adicionando gate de login antes do `AppShell`.
- Códigos internos: função `generateInternalCode(projects)` calcula `NN` = quantidade de projetos criados no ano + 1, ano = ano atual.
- Vinculação atividade↔meta: adicionar `goalId: string` em `Activity` no `mockData.ts`/tipos.
- Auditoria: shape `{ id, userLogin, timestamp, area, action, detail }`; ganchos nos stores.
- Índice de maturidade protegido: modal `AdminUnlockDialog` reutilizável.
- Financeiro scroll: `<ScrollArea className="max-h-[420px]">`.

## Fora de escopo (não farei agora)
- Envio real de e-mails de notificação (fica só o mock/UI).
- Backend/Cloud (o usuário disse que é para navegar e testar).
- Cadastro público de usuários — os dois logins são fixos.
