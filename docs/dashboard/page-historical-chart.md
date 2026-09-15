# Tela: Histórico — Gráficos de Todas as Variáveis

**Componente:** `src/features/historico/components/HistoricoPage.jsx`  
**Release:** 2.0 (A1.8)  
**Rota/aba:** `historico`

---

## 1. Visão Geral e Justificativa

A tela de Histórico evoluiu da Release 1 (um único gráfico de temperatura e umidade) para uma visualização completa de todas as variáveis do sistema, com capacidade de expansão temporal interativa.

**Decisões de design:**

- **4 gráficos separados** em vez de um único multi-eixo: reduz o ruído visual e permite leitura independente de cada grandeza física (temperatura, umidade, luminosidade, pH).
- **Expansão progressiva** ("carregar mais") em vez de paginação clássica: o usuário percorre o tempo de forma contínua, sem perder o contexto dos dados já carregados.
- **Botão por gráfico na borda esquerda**: posicionado onde a linha do tempo termina, tornando a ação de "ir mais atrás" intuitiva — você literalmente clica onde o dado acaba.

---

## 2. Interface e Funcionalidades

### 2.1 Controles

| Controle | Descrição |
|---|---|
| Seletor de canteiro | Filtra todos os gráficos pelo canteiro selecionado |
| Janela inicial (1d / 3d / 7d) | Define o período inicial exibido e o incremento do "carregar mais" |
| Botão Atualizar | Re-fetcha o período atual mantendo o range expandido |
| Badge "Inclui leitura atual" | Aparece quando a leitura em tempo real foi appendada ao gráfico |
| Exportar CSV | Exporta todos os dados do range completo (não só a janela inicial) |

### 2.2 Estatísticas de resumo

Acima dos gráficos, cards com **mín / méd / máx** por variável para o período visível:
- Temperatura Ar
- Umidade Solo
- pH Solo
- Luminosidade máxima

### 2.3 Os 4 gráficos

| Gráfico | Variáveis | Eixo Y |
|---|---|---|
| 🌡️ Temperatura | Temp. Ar (°C) + Temp. Solo (°C) | 10–40 °C |
| 💧 Umidade | Umidade Ar (%) + Umidade Solo (%) | 0–100 % |
| ☀️ Luminosidade | Luminosidade (lx) | 0–∞ lx |
| 🧪 pH do Solo | pH Solo | 4–9 |

### 2.4 Expansão temporal (carregar mais)

Cada gráfico tem um botão na **borda esquerda** (onde a linha do tempo começa):

```
[←+1d][ 🌡️ Temperatura (°C)  ──────────────── ]
[←+1d][ 💧 Umidade (%)        ──────────────── ]
[←+1d][ ☀️ Luminosidade (lx)  ──────────────── ]
[←+1d][ 🧪 pH do Solo          ──────────────── ]
```

- O incremento (`+Xd`) segue a **janela inicial selecionada** (1d, 3d ou 7d)
- Clicar em qualquer botão expande **todos os gráficos** simultaneamente
- Ao esgotar os dados, o botão é substituído por `✓ início`
- O indicador `"Exibindo X dias · N leituras válidas"` atualiza a cada expansão

### 2.5 Leitura atual integrada

`fetchCurrentTelemetry` é chamado em paralelo com `fetchHistorico`. Se o timestamp da leitura atual for mais recente que o último ponto histórico, ela é **appendada ao final de todos os datasets**, garantindo que os gráficos sempre terminam no momento presente. O último ponto é destacado visualmente (`pointRadius: 5`).

---

## 3. Estados Visuais

| Estado | Comportamento |
|---|---|
| Carregando | Spinner centralizado com texto "Carregando histórico…" |
| Sem leituras válidas | Mensagem "Sem leituras válidas no período selecionado" |
| Dados offline | Linhas com gaps (`spanGaps: true`) — pontos `null` não quebram o gráfico |
| Erro de API | `ErrorBlock` com mensagem + código `HSM-HST-001` + botão "Tentar novamente" |
| Carregando mais | Spinner no botão esquerdo, demais botões permanecem clicáveis |
| Fim dos registros | Botão esquerdo substituído por `✓ início` (verde) |

---

## 4. Estrutura de Dados Mock

**Arquivo:** `src/features/telemetry/mocks/telemetry.mock.js`

Gera **169 leituras horárias** (7 dias × 24h + 1) **ancoradas em `Date.now()`**, garantindo que os dados estejam sempre dentro do filtro de 7 dias independente da data atual.

```js
{
  id:                number,
  canteiro_id:       'canteiro-a' | 'canteiro-b' | 'canteiro-c',
  timestamp:         ISO 8601,          // relativo a Date.now()
  temperatura:       number | null,     // null = sensor offline
  temperatura_solo:  number | null,
  umidade:           number | null,
  umidade_solo:      number | null,
  luminosidade:      number | null,
  PH_solo:           number | null,     // null = dado parcial
  status_bomba:      boolean,
  irrigacao_manual:  boolean,
  status:            'ok' | 'offline' | 'suspeito'
}
```

**Cenários cobertos por canteiro:**

| Canteiro | Cenário |
|---|---|
| A – Alface | Happy path + spike de pH anômalo (3.8) no dia 3 ao meio-dia |
| B – Tomate | Sensor offline nas últimas 6h + pH null em intervalos (dado parcial) |
| C – Manjericão | Irrigação manual 12h atrás + sem irrigação automática |

---

## 5. Arquitetura da Camada de Serviço

**Arquivo:** `src/features/historico/services/historicoService.js`

```js
// Fetch principal — retorna todos os itens do período (limit: 9999)
fetchHistorico({ canteiroId, days, page: 0, limit: 9999 })

// Exportação — gera blob CSV e aciona download
exportHistoricoCSV({ canteiroId, days })
```

**Comportamento com API real:**
- `GET /api/v1/historico?canteiro=X&days=Y` → dados históricos
- Se retornar **404** → fallback automático para mock (sem erro na tela)
- Outros erros HTTP → `HortaError('HSM-HST-001', mensagem)`

**Modo mock:** ativado quando `VITE_USE_MOCK=true` ou `VITE_API_URL` não está definida.

---

## 6. Testes

**Arquivo:** `src/tests/HistoricoPage.test.jsx` — 7 testes:

| Teste | O que valida |
|---|---|
| exibe spinner durante carregamento | Estado de loading inicial |
| renderiza gráficos após carregar dados | ≥4 canvas `line-chart` no DOM |
| exibe títulos dos 4 gráficos | Cabeçalhos com emoji presentes |
| exibe estatísticas de resumo | Cards mín/méd/máx presentes |
| exibe empty state sem leituras válidas | Mensagem quando todos os pontos são offline |
| chama exportHistoricoCSV ao clicar | Função do serviço é invocada |
| exibe ErrorBlock quando fetch falha | Mensagem de erro com código HSM |

---

## 7. Stack Técnica

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Componente funcional com hooks |
| Chart.js + react-chartjs-2 | ^4.5 / ^5.3 | 4 gráficos de linha |
| chartjs-adapter-date-fns | ^3.0 | Eixo X temporal com formato dd/MM HH:mm |
| Tailwind CSS | ^3.4 | Layout responsivo, cards, botões |
| lucide-react | ^1.16 | Ícones (ChevronsLeft, CheckCircle2, Download) |
