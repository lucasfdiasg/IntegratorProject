# Release Notes — v0.2.0-dashboard-rc

**Tag:** `v0.2.0-dashboard-rc`  
**Data:** 2026-06-14  
**Tipo:** Release Candidate (A1.8)  
**Repositório:** `lucasfdiasg/IntegratorProject`  
**Branch:** `feat/a1.8-dashboard-completo`

---

## 1. Resumo

Esta release entrega o dashboard completo E2E com as 4 telas do escopo do PI, partindo da tela de Histórico (única entregue na Release 1) para um produto completo. Inclui: sistema de alertas funcional com 14 alertas mockados, controle de bomba de irrigação por canteiro, relatório semanal agregado, CRUD de canteiros com propagação em tempo real, gráficos históricos com expansão temporal progressiva, camada de observabilidade instrumentada e threat model do front-end.

---

## 2. O que entrou desde a Release 1

### 2.1 Novas Telas

| Tela | Componente | Serviço | Mock |
|---|---|---|---|
| Principal | `PrincipalPage.jsx` | `telemetryService.js` | `telemetry.mock.js` |
| Alertas | `AlertasPage.jsx` | `alertasService.js` | `alertas.mock.js` |
| Histórico (reescrito) | `HistoricoPage.jsx` | `historicoService.js` | `telemetry.mock.js` |
| Cadastro de Canteiros | `CanteirosPage.jsx` | `canteirosService.js` | `canteiros.mock.js` |

### 2.2 Funcionalidades por Tela

**Principal:**
- 6 cards de leitura atual (temperatura ar/solo, umidade ar/solo, luminosidade, pH)
- Banner de status dinâmico (online / offline / suspeito)
- Gráfico histórico das últimas 24h (temperatura, umidade solo, luminosidade normalizada)
- Relatório semanal de irrigação: gráfico de barras + tabela com ciclos e litros estimados por canteiro
- Controle de bomba de irrigação por canteiro (ligar / desligar) com estado visual
- Tendência de sessão: acumula leituras do polling (60s, máx 60 pontos, singleton de módulo)

**Alertas:**
- Lista filtrada por canteiro, tipo, severidade e período (1/3/7 dias)
- Paginação incremental ("Carregar mais")
- Ação de marcar como lido
- Badge de não lidos na sidebar
- Painel "Logs do Sistema" colapsável: últimas 200 entradas do logger, filtráveis por nível

**Histórico:**
- 4 gráficos de linha separados: 🌡️ Temperatura, 💧 Umidade, ☀️ Luminosidade, 🧪 pH
- Estatísticas mín/méd/máx por variável
- Botão `+Xd` individual em cada gráfico na borda esquerda — expande o range temporal progressivamente
- Incremento segue o filtro ativo (1d/3d/7d)
- Indicador "Todos os registros carregados" ao atingir o primeiro registro
- Leitura atual appendada ao dataset como último ponto (badge "Inclui leitura atual")
- Exportação CSV do range completo

**Cadastro de Canteiros:**
- CRUD completo: listar, criar, editar, excluir
- Modal com formulário e validação client-side em todos os campos
- Toast de confirmação por operação
- Propagação automática via `CustomEvent('canteiros:updated')` — seletores de Principal, Histórico e Alertas atualizam sem reload

### 2.3 Infraestrutura Nova

| Arquivo | Responsabilidade |
|---|---|
| `src/shared/utils/logger.js` | Logger JSON estruturado + store in-memory (200 entradas) + `getLogs()` + métricas |
| `src/shared/utils/errors.js` | 14 error codes `HSM-*` + classe `HortaError` |
| `src/shared/utils/fetchOrMock.js` | Fallback automático 404 → mock |
| `src/shared/components/ErrorBlock.jsx` | Bloco de erro unificado (mensagem + código rastreável) |
| `src/shared/hooks/useCanteiros.js` | Hook com evento `refreshCanteiros` para sincronização live |
| `src/features/irrigacao/services/irrigacaoService.js` | Toggle de bomba por canteiro com fallback 404 → mock |
| `babel.config.cjs` | Plugin Babel inline para `import.meta.env → process.env` em Jest |
| `jest.config.cjs` | Config Jest em CJS (compatível com `"type": "module"`) |

### 2.4 Mock Data

- **Telemetria:** 3 canteiros × 169 leituras horárias ancoradas em `Date.now()` (sempre dentro do filtro de 7 dias)
- **Alertas:** 14 alertas distribuídos entre 6h e 160h atrás, cobrindo todos os tipos e severidades
- **Canteiros:** 3 canteiros pré-cadastrados (Alface, Tomate, Manjericão)

| Canteiro | Cenário |
|---|---|
| A – Alface | Happy path + spike pH anômalo (3.8) no dia 3 ao meio-dia |
| B – Tomate | Sensor offline nas últimas 6h + pH null em intervalos (dado parcial) |
| C – Manjericão | Irrigação manual 12h atrás + sem irrigação automática |

### 2.5 Documentação

| Arquivo | Conteúdo |
|---|---|
| `docs/dashboard/threat-model.md` | 5 ameaças (XSS, TLS, credenciais, injeção, CSRF) + mitigações + SCA |
| `docs/ops/observability-dashboard.md` | Logs estruturados, métricas, runbook (4 sintomas) |
| `docs/dashboard/page-historical-chart.md` | Documentação da HistoricoPage (Release 2) |
| `docs/dashboard/page-historico-grafico.md` | Documentação da seção histórica da PrincipalPage |
| `docs/audit/peer-audit-recebida.md` | Template para auditoria cruzada (Aula 18) |
| `docs/audit/peer-audit-respondida.md` | Template de resposta à auditoria |
| `docs/dashboard/evidencias/` | `npm-audit`, `test-run`, `structured-logs` (todos 2026-06-14) |

---

## 3. Breaking Changes e Migração

| Item | Tipo | Migração |
|---|---|---|
| `src/components/` → `src/features/` | Arquitetural | Imports antigos (`src/components/Dashboard/HistoryChart`) continuam funcionando — arquivo mantido. Novos componentes em `src/features/`. |
| `telemetry.mock.js` — timestamps fixos → `Date.now()` | Breaking | Mock antigo com data fixa `2026-06-04` filtrava como vazio. Novo mock usa `Date.now()` — dados sempre visíveis. |
| `telemetryService.js` — assinatura | Breaking | `fetchCurrentTelemetry(canteiroId)` e `fetchTelemetryHistory(canteiroId, days)` aceitam `canteiroId`. Default `'canteiro-a'` mantém backward compat. |
| `CANTEIROS_MOCK` → `useCanteiros()` | Breaking | Pages não importam mais o array estático. Usar o hook `useCanteiros()` para obter lista live. |
| `jest.config.js` → `jest.config.cjs` | Config | Script `npm test` atualizado. Nenhuma ação manual. |

---

## 4. Rastreabilidade E2E

| UC / Requisito | Tela | Componente | Testes | Evidência |
|---|---|---|---|---|
| RF-001 (Monitoramento tempo real) | Principal | `PrincipalPage.jsx` | `PrincipalPage.test.jsx` — 10 testes | `test-run-20260614.log` |
| RF-002 (Histórico de leituras) | Histórico | `HistoricoPage.jsx` | `HistoricoPage.test.jsx` — 7 testes | `test-run-20260614.log` |
| RF-003 (Alertas e notificações) | Alertas | `AlertasPage.jsx` | `AlertasPage.test.jsx` — 6 testes | `test-run-20260614.log` |
| RF-004 (Gestão de canteiros) | Canteiros | `CanteirosPage.jsx` | `CanteirosPage.test.jsx` — 7 testes | `test-run-20260614.log` |
| RF-005 (Controle de irrigação) | Principal | `irrigacaoService.js` | `PrincipalPage.test.jsx` — 3 testes bomba | `test-run-20260614.log` |
| UC-02 (Sensor offline) | Principal + Histórico | Mock Canteiro B | `PrincipalPage.test.jsx` (banner offline) | `test-run-20260614.log` |
| — (Fluxo E2E completo) | Todas | `App.jsx` | `E2E.flow.test.jsx` — 1 teste | `test-run-20260614.log` |
| — (Componente legado) | — | `HistoryChart.jsx` | `HistoryChart.test.jsx` — 10 testes | `test-run-20260614.log` |

**Total: 41/41 testes passando — 7 suites**

---

## 5. Como Rodar Localmente

```bash
git clone https://github.com/lucasfdiasg/IntegratorProject.git
cd IntegratorProject
npm install
npm run dev        # http://localhost:5173 — mock ativo por padrão
npm test           # 41/41 testes
```

**Modo mock explícito (Windows):**
```powershell
echo "VITE_USE_MOCK=true" > .env.local
npm run dev
```

**Modo API real:**
```powershell
del .env.local     # usa VITE_API_URL do .env
npm run dev
```

---

## 6. Issues Fechadas / PRs Mergeados

| Tipo | Descrição |
|---|---|
| BUG | `loadAllData(True)` — `True` não existe em JS → corrigido para `true` |
| BUG | `import.meta.env` incompatível com Jest/Babel CJS → plugin Babel inline |
| BUG | Timestamps fixos no mock filtravam como vazios → ancorados em `Date.now()` |
| BUG | `useRef` do trend buffer resetava ao trocar aba → singleton de módulo |
| BUG | `setInterval` reiniciado a cada render → padrão `loadRef` |
| BUG | CRUD de canteiros sem fallback 404 → mutations com fallback implementado |
| BUG | `handleSave` sem `catch` engolia erros de API silenciosamente |
| BUG | Canteiros criados não apareciam nos seletores → `useCanteiros` + `refreshCanteiros` |
| BUG | `hasMore` sempre `false` no Histórico → comparação de contagem anterior vs atual |
| FEAT | Tela Principal com gráficos e relatório semanal |
| FEAT | Tela de Alertas com filtros e painel de logs |
| FEAT | Tela de Histórico com gráficos e expansão temporal |
| FEAT | Tela de Cadastro de Canteiros com CRUD |
| FEAT | Controle de bomba de irrigação por canteiro |
| FEAT | Error codes rastreáveis `HSM-*` em todos os serviços |
| FEAT | Logger estruturado + métricas + `getLogs()` |
| FEAT | Fallback automático 404 → mock em todos os serviços |
| DOCS | Threat model com 5 ameaças e evidência de SCA |
| DOCS | Runbook de observabilidade com 4 sintomas |
| DOCS | Evidências: npm audit + test run + structured logs (2026-06-14) |
