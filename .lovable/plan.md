# Plano — Alterações INOVA CRIA (rodada atual)

## Reorganização do menu

```
Dashboard
INOVA FAS/FUNBIO  ← grupo (expansível)
  ├─ Comunidades
  └─ Projetos
Cronograma 2026
Diagnóstico
Relatórios
Configurações
```

Sidebar recebe grupo com dois filhos; navegação já existe (`activeNav`), só adiciono os itens novos e um estado de "expandido" para o grupo.

## 1. Comunidades (novo)

Seed com as 20 comunidades do `Planos_de_trabalho...xlsx`.

**Dados base:** Nome · Código Interno (`NN-2026`) · Responsável Técnico / Ponto Focal CRIA · Segmento Social · Eixo Principal · Classificação · Localização · Financiador · Objetivo · Valor Total · Início Previsto · Final Previsto · Status.

**Seções (accordions editáveis, cada uma com lista + texto livre):**
Pessoas · Infraestrutura · Certificação · Fornecedores · Compradores · Capacitação · Território · Produtos.

Cada comunidade tem **1 projeto vinculado** (mesmo id). O botão "Abrir projeto" leva para a aba Projeto correspondente.

## 2. Projetos (reescrito)

**Removido:** aba **Monitoramento**. O resumo (progresso geral, alerta de metas, orçamento consumido) migra para o **Dashboard**.

**Cadastro** agora reúne os tópicos do plano de trabalho (aplicáveis a todo projeto — não só ADESC), organizados em accordions editáveis:

- **I — Apresentação:** Título · Prazo de execução · Valor total · Coordenador(a) · Empresa/organização · Equipe.
- **Critério I — Relevância:** Problemática · Justificativa · Localização e abrangência · Objetivo · Diversidade · Saberes locais.
- **Critério II — Capacidade Técnica:** Experiência prévia · Capacidade técnica e gerencial/equipe · Estratégia · Cronograma físico (metas/etapas) · Detalhamento do plano de aplicação dos recursos · Contrapartida · Justificativa da contrapartida.
- **Critério III — Impacto:** Resultado(s) e impacto(s) previstos · Beneficiários (público-alvo) · Total diretamente/indiretamente beneficiadas · Forma de acompanhamento e avaliação.
- **Critério IV — Replicabilidade:** Potencial de replicabilidade · Potencial de ampliação.
- **Extras da planilha:** Status · Pilares · Metas · Detalhamento por plano de trabalho · Compradores · Garantia de venda · Destinação · Ativações · Oportunidades · Receita · Valor do repasse · Forma de repasse · Status do repasse · Data do repasse · Observações · Plano atualizado.

Cada projeto puxa dados iniciais da comunidade vinculada. Tudo editável (LJCRIA); histórico via auditoria.

**Mantidos:** Financeiro · Gestão de Risco · Gestão de Mudança · Evidências e Relatório.

## 3. Dashboard

Recebe o **Resumo do Monitoramento** que estava na aba: progresso do portfólio, alertas de metas em atraso, orçamento consumido vs total, últimas ações auditadas. Botões "+ Novo Projeto" e "Atualizar agora" continuam ocultos.

## 4. Cronograma 2026 (novo, fora do grupo INOVA)

Base: `Instituições_e_Rotas_-_Doc_Vinculado_ao_Plano_de_Trabalho.xlsx` (12 rotas, 20 organizações).

- **Rotas** — tabela editável com rota, comunidade, município/UF, dias de atuação, modal de acesso, tipo de comunidade, notas logísticas.
- **Calendário 2026** — grade de 12 meses. Cada evento: título, data, tipo (Visita técnica / Prazo / Logística / Reunião), rota, comunidade vinculada, responsável, observações. CRUD completo.

## 5. Diagnóstico — ajustes

- **Vincular à Comunidade** (select de comunidades) no lugar de "Título".
- **Projeto** (select filtrado pela comunidade) no lugar de "Organização".
- **Índice de Maturidade em 3 rodadas** (R1 / R2 / R3), cada rodada é um snapshot independente com gráfico comparativo.
- Antes de iniciar/editar uma rodada exige **login do avaliador** + **data de realização** (obrigatórios).
- Rodada marcada como **Finalizada** só pode ser alterada com **senha do administrador** (reutiliza `AdminUnlockDialog`).
- Restante do diagnóstico (perguntas, cesta de produtos, resumo) permanece.

## Detalhes técnicos

- `src/app/data/comunidades.ts` (seed com 20 registros) e `src/app/data/rotas.ts` (seed com 12 rotas e organizações).
- `src/app/store.tsx`: acrescentar `communities`, `routes`, `calendarEvents` (CRUD + auditoria). Projeto ganha `communityId`.
- Novos componentes: `ComunidadesPage.tsx`, `ComunidadeView.tsx`, `CronogramaPage.tsx`.
- `ProjectView.tsx`: remover aba Monitoramento; `TabCadastro.tsx` reescrito com os accordions dos tópicos.
- `Dashboard.tsx`: absorver o resumo do monitoramento.
- `Sidebar.tsx`: grupo colapsável "INOVA FAS/FUNBIO".
- `DiagnosticoPage.tsx` + `diagnostic/store.tsx`: modelo de 3 rodadas + gate de login/data + gate admin para editar rodada finalizada.

## Fora de escopo

- Parse dos PDFs de plano de trabalho (o nome do arquivo aparece como referência textual).
- Backend — segue tudo em `localStorage`.
