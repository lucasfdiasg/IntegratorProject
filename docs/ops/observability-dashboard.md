# Observabilidade — Dashboard HortaSmart

**Versão:** 1.1 (A1.8 / Release 2)  
**Data:** 2026-06-14

---

## 1. Logs Estruturados

### Implementação

O módulo `src/shared/utils/logger.js` emite todas as mensagens como JSON minificado no `console` do navegador, com os campos:

```json
{
  "level":      "INFO | WARN | ERROR | DEBUG",
  "ts":         "2026-06-14T15:24:11.716Z",
  "requestId":  "req-1749146872881-a3f2c",
  "component":  "AlertasPage",
  "message":    "loaded",
  "total":      8,
  "page":       0
}
```

**Correlação de request:** `generateRequestId()` gera um ID único por chamada fetch. O mesmo ID aparece nos logs `fetch_start` e `fetch_ok`/`fetch_error`, permitindo rastrear uma operação ponta-a-ponta no console filtrando por `requestId`.

**Painel de logs no dashboard:** A aba Alertas exibe os últimos 200 logs da sessão em tempo real, filtráveis por nível (ERROR / WARN / INFO / DEBUG), diretamente na interface.

**Store in-memory:** Os logs são mantidos em memória (`_logs[]`) e acessíveis via `getLogs()` importável por qualquer componente.

### Evidência — logs capturados durante execução dos testes (2026-06-14)

```
{"level":"INFO","ts":"2026-06-14T15:24:11.716Z","requestId":null,"component":"PrincipalPage","message":"data_loaded","canteiro":"canteiro-a"}
{"level":"INFO","ts":"2026-06-14T15:24:11.825Z","requestId":null,"component":"PrincipalPage","message":"data_loaded","canteiro":"canteiro-a"}
{"level":"ERROR","ts":"2026-06-14T15:24:12.098Z","requestId":null,"component":"PrincipalPage","message":"API indisponível"}
{"level":"INFO","ts":"2026-06-14T15:24:12.571Z","requestId":null,"component":"App","message":"app_started"}
{"level":"INFO","ts":"2026-06-14T15:24:12.623Z","requestId":null,"component":"AlertasPage","message":"loaded","total":2,"page":0}
{"level":"INFO","ts":"2026-06-14T15:24:12.651Z","requestId":null,"component":"AlertasPage","message":"mark_lido","id":"a-001"}
{"level":"INFO","ts":"2026-06-14T15:24:12.700Z","requestId":null,"component":"HistoricoPage","message":"charts_loaded","points":5,"days":1}
{"level":"WARN","ts":"2026-06-14T15:24:12.720Z","requestId":null,"component":"alertasService","message":"endpoint_not_found_fallback_mock","note":"Endpoint /alertas ausente na API — usando dados mock."}
{"level":"INFO","ts":"2026-06-14T15:24:12.750Z","requestId":null,"component":"canteirosService","message":"fetch_canteiros"}
{"level":"INFO","ts":"2026-06-14T15:24:12.780Z","requestId":null,"component":"useCanteiros","message":"loaded","count":3}
```

Arquivo completo: `docs/dashboard/evidencias/structured-logs-20260614.log` (68 entradas)

---

## 2. Métricas Capturadas

### Implementação

O objeto `metrics` em `logger.js` mantém um store in-memory acessível via DevTools:

```js
// No console do navegador:
window.__horta_metrics__
```

**Métricas disponíveis:**

| Métrica | Descrição | Log emitido |
|---|---|---|
| `fetch_calls` | Total de chamadas fetch disparadas | `"message":"fetch_recorded"` |
| `fetch_errors` | Contagem de erros de fetch | `"success":false` |
| `fetch_total_ms` | Soma das latências (ms) | — |
| `avg_fetch_ms` | Latência média calculada no snapshot | `"avg_ms":8` |
| `alerts_displayed` | Total de alertas renderizados na sessão | `"message":"alerts_displayed","count":2` |
| `render_times.principal` | Histórico de tempos de render da PrincipalPage | `"message":"render_time","page":"principal","ms":8` |

### Evidência de métricas capturadas (teste E2E — 2026-06-14)

```
{"level":"INFO","component":"metrics","message":"alerts_displayed","count":2,"total":2}
{"level":"INFO","component":"metrics","message":"render_time","page":"principal","ms":19,"avg_ms":19}
{"level":"INFO","component":"AlertasPage","message":"loaded","total":2,"page":0}
{"level":"INFO","component":"HistoricoPage","message":"charts_loaded","points":5,"days":1}
```

**Snapshot de métricas após o fluxo E2E completo:**
```js
window.__horta_metrics__ = {
  fetch_calls:     12,
  fetch_errors:     1,   // teste de erro deliberado
  fetch_total_ms: 340,
  alerts_displayed: 2,
  render_times: {
    principal: [19]
  },
  avg_fetch_ms: 28.3
}
```

---

## 3. Runbook — Dashboard em Erro Persistente em Produção

### Sintoma: Dashboard mostra tela de erro em todas as páginas

**Passo 1 — Identificar o código de erro no console do navegador**
```
F12 → Console → filtrar por level:"ERROR"
```
Campos relevantes: `component`, `message`, `errorCode`. O código `HSM-*` identifica exatamente onde a falha ocorreu:

| Código | Origem | Ação |
|---|---|---|
| `HSM-TEL-001` | Timeout (> 40s) | Verificar latência da API ou aumentar timeout |
| `HSM-TEL-002/003` | Endpoint de telemetria indisponível | Verificar backend ESP32 |
| `HSM-TEL-005` | HTTP error genérico | Ver status code no log |
| `HSM-ALR-001` | Alertas indisponíveis | Normal se endpoint não implementado — usa mock |
| `HSM-HST-001` | Histórico indisponível | Normal se endpoint não implementado — usa mock |

**Passo 2 — Verificar conectividade com a API**
```bash
curl -I https://<VITE_API_URL>/api/v1/telemetria/atual
# Esperado: 200 OK
# Problema: timeout, 502, 503 → backend indisponível
```

**Passo 3 — Verificar variáveis de ambiente**
```bash
echo $VITE_API_URL    # deve ser https://...
echo $VITE_USE_MOCK   # deve estar vazio ou "false" em produção
```
Se `VITE_API_URL` estiver vazio → front cai em modo mock (sem erro, dados estáticos).  
Se estiver incorreto → fetch retorna CORS ou 404 → `HSM-TEL-005` na tela.

**Passo 4 — Verificar CORS**
```
Console → Network → OPTIONS preflight
# Verificar: "Access-Control-Allow-Origin" presente na resposta
```

**Passo 5 — Checar taxa de erros via métricas**
```js
window.__horta_metrics__
// fetch_errors / fetch_calls > 50% → API instável
// avg_fetch_ms > 5000 → latência alta, risco de timeout
```

**Passo 6 — Ativar modo mock temporariamente**
```bash
# Adicionar VITE_USE_MOCK=true nas variáveis do deploy e redeploy
# Dashboard exibe dados mockados enquanto a API é restaurada
```

---

### Sintoma: Histórico não carrega / botão "Carregar mais" não aparece

1. Verificar log `HistoricoPage charts_loaded` — se `points: 0`, os dados do período estão fora do range.
2. Os mocks usam `Date.now()` como âncora — se `VITE_USE_MOCK=true` e ainda assim não há dados, verificar se o browser está com o horário correto.
3. Com API real: verificar se `GET /api/v1/historico` retorna dados no formato esperado (`{ items, total, page, limit, totalPages }`).
4. O botão "Carregar mais" só aparece se o segundo load retornar mais registros que o primeiro — se a API retornar sempre o mesmo conjunto, o botão não aparece.

---

### Sintoma: Alertas não disparam mesmo com sensores offline

1. Verificar log `alertasService endpoint_not_found_fallback_mock` — se presente, a API não tem o endpoint `/alertas` e o front está usando mock. Os alertas mockados são estáticos.
2. Com API real: confirmar que o serviço de geração de alertas no backend está rodando e populando a tabela de alertas.
3. Verificar filtros ativos na tela — o período padrão é 7 dias; alertas mais antigos não aparecem.

---

### Sintoma: Bomba de irrigação não responde ao clique

1. Verificar log `irrigacaoService toggle_bomba` — se ausente, o botão está desabilitado (sensor offline).
2. Log `irrigacaoService endpoint_not_found_fallback_mock` → endpoint `/bomba` não existe na API, controle funciona localmente apenas.
3. Com API real: verificar `POST /api/v1/canteiros/{id}/bomba` retorna 200. O corpo deve conter `{ ativo: boolean }`.
