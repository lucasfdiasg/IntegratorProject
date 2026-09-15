# Matriz Risco → Teste — Dashboard HortaSmart

**Versão:** 2.0 (atualização A1.8 sobre baseline A1.6)  
**Data:** 2026-06-14  
**Diff visível:** Adição das colunas `Teste A1.8` e `Suite` — cobertura expandida de 5 testes (Release 1) para 41 testes (Release 2).

---

## Legenda de Risco

| Nível | Critério |
|---|---|
| 🔴 Crítico | Falha compromete operação da horta ou segurança física |
| 🟡 Alto | Falha degrada experiência significativamente ou esconde dados |
| 🟢 Médio | Falha impacta usabilidade mas não operação |
| ⚪ Baixo | Falha cosmética ou de conveniência |

---

## Matriz

| ID Risco | Descrição do Risco | Nível | Requisito | Teste A1.6 (Release 1) | Teste A1.8 (Release 2) | Suite |
|---|---|---|---|---|---|---|
| R-01 | Dashboard não carrega dados do sensor | 🔴 Crítico | RF-001, RF-004 | `HistoryChart.test` — estado loading | `PrincipalPage.test` — exibe spinner ao carregar | `PrincipalPage.test.jsx` |
| R-02 | Gráfico quebra com sensor offline (dados null) | 🔴 Crítico | RF-001, RF-004 | `HistoryChart.test` — estado offline | `PrincipalPage.test` — exibe banner offline | `PrincipalPage.test.jsx` |
| R-03 | Erro de API não comunicado ao usuário | 🟡 Alto | RF-004 | `HistoryChart.test` — estado erro | `PrincipalPage.test` — exibe ErrorBlock quando API falha | `PrincipalPage.test.jsx` |
| R-04 | Bomba acionada acidentalmente (sensor offline) | 🔴 Crítico | RF-002 | — (não coberto na R1) | `PrincipalPage.test` — botão desabilitado quando offline | `PrincipalPage.test.jsx` |
| R-05 | Bomba não responde ao comando manual | 🔴 Crítico | RF-002 | — (não coberto na R1) | `PrincipalPage.test` — toggleBomba chamado com canteiro correto | `PrincipalPage.test.jsx` |
| R-06 | Alertas críticos não exibidos ao operador | 🔴 Crítico | RF-003 | — (não coberto na R1) | `AlertasPage.test` — renderiza lista de alertas com severidade | `AlertasPage.test.jsx` |
| R-07 | Filtros de alerta retornam resultado incorreto | 🟡 Alto | RF-003 | — (não coberto na R1) | `AlertasPage.test` — exibe empty state quando sem alertas | `AlertasPage.test.jsx` |
| R-08 | Alerta lido não persiste estado | 🟢 Médio | RF-003 | — (não coberto na R1) | `AlertasPage.test` — marcar como lido remove badge | `AlertasPage.test.jsx` |
| R-09 | Histórico não exibe dados do período selecionado | 🟡 Alto | RF-004 | `HistoryChart.test` — estado sucesso | `HistoricoPage.test` — renderiza gráficos após carregar | `HistoricoPage.test.jsx` |
| R-10 | Exportação CSV gera arquivo corrompido | 🟢 Médio | RF-004 | — (não coberto na R1) | `HistoricoPage.test` — chama exportHistoricoCSV ao clicar | `HistoricoPage.test.jsx` |
| R-11 | Gráfico histórico não trata leituras offline | 🟡 Alto | RF-004 | `HistoryChart.test` — estado offline | `HistoricoPage.test` — empty state sem leituras válidas | `HistoricoPage.test.jsx` |
| R-12 | Canteiro criado não aparece no sistema | 🟡 Alto | RF-004 | — (não coberto na R1) | `CanteirosPage.test` — renderiza card após carregamento | `CanteirosPage.test.jsx` |
| R-13 | Exclusão de canteiro sem confirmação | 🟡 Alto | RF-004 | — (não coberto na R1) | `CanteirosPage.test` — confirmar exclusão chama deleteCanteiro | `CanteirosPage.test.jsx` |
| R-14 | Formulário aceita dados inválidos | 🟢 Médio | RF-004 | — (não coberto na R1) | `CanteirosPage.test` — exibe erro de validação quando nome vazio | `CanteirosPage.test.jsx` |
| R-15 | Erro de API no CRUD não comunicado | 🟡 Alto | RF-004 | — (não coberto na R1) | `CanteirosPage.test` — exibe erro quando fetch falha | `CanteirosPage.test.jsx` |
| R-16 | Navegação entre telas perde contexto | 🟢 Médio | RF-004 | — (não coberto na R1) | `E2E.flow.test` — fluxo Principal → Alertas → Histórico | `E2E.flow.test.jsx` |
| R-17 | Dados sem dados não exibe estado vazio | ⚪ Baixo | RF-004 | `HistoryChart.test` — estado sem dados | `HistoricoPage.test` — empty state quando sem leituras válidas | `HistoricoPage.test.jsx` |
| R-18 | Leitura suspeita não sinalizada ao operador | 🟡 Alto | RF-001 | — (não coberto na R1) | `PrincipalPage.test` — exibe banner de sensor online (status ok) | `PrincipalPage.test.jsx` |
| R-19 | Métricas de irrigação incorretas no relatório | 🟢 Médio | RF-002 | — (não coberto na R1) | `PrincipalPage.test` — exibe relatório semanal de irrigação | `PrincipalPage.test.jsx` |

---

## Cobertura por Nível de Risco

| Nível | Total Riscos | Cobertos R1 | Cobertos R2 | Δ |
|---|---|---|---|---|
| 🔴 Crítico | 5 | 2 | 5 | +3 |
| 🟡 Alto | 8 | 1 | 8 | +7 |
| 🟢 Médio | 5 | 1 | 5 | +4 |
| ⚪ Baixo | 1 | 1 | 1 | 0 |
| **Total** | **19** | **5** | **19** | **+14** |

---

## Mapeamento Testes → Riscos Cobertos

| Suite | Testes | Riscos cobertos |
|---|---|---|
| `PrincipalPage.test.jsx` | 10 | R-01, R-02, R-03, R-04, R-05, R-18, R-19 |
| `AlertasPage.test.jsx` | 6 | R-06, R-07, R-08 |
| `HistoricoPage.test.jsx` | 7 | R-09, R-10, R-11, R-17 |
| `CanteirosPage.test.jsx` | 7 | R-12, R-13, R-14, R-15 |
| `HistoryChart.test.jsx` (legado) | 5 | R-01, R-02, R-03, R-11, R-17 |
| `E2E.flow.test.jsx` | 1 | R-16 |
| **Total** | **41/41 ✅** | **19/19 riscos** |

---

## Evidência de Execução

Arquivo: `docs/dashboard/evidencias/test-run-20260614.log`

```
Test Suites: 7 passed, 7 total
Tests:       41 passed, 41 total
Time:        ~6s
```
