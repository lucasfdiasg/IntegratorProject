# Tela: Principal — Gráfico Histórico e Tendência de Sessão

**Componente:** `src/features/principal/components/PrincipalPage.jsx`  
**Release:** 2.0 (A1.8)  
**Rota/aba:** `principal`

---

## 1. Visão Geral

A tela Principal combina **leitura atual** (cards de valor instantâneo) com **contexto histórico** (gráfico das últimas 24h e tendência de sessão), permitindo ao operador identificar de imediato o estado da horta e sua evolução recente — sem precisar navegar para a aba Histórico.

---

## 2. Seções da Tela

### 2.1 Seletor de canteiro + timestamp

Botões de seleção para os canteiros cadastrados. O timestamp de última atualização é exibido no canto superior direito com botão de refresh manual.

### 2.2 Banner de status

Faixa colorida indicando o estado atual do sensor selecionado:

| Cor | Estado | Mensagem |
|---|---|---|
| Verde | Online | `Sensor online · Irrigação: inativa / ativa (manual)` |
| Âmbar | Suspeito | `Leitura suspeita detectada — verifique o sensor` |
| Vermelho | Offline | `Sensor offline — última leitura indisponível` |

### 2.3 Cards de leitura atual (6 cards)

Valores instantâneos da última leitura bem-sucedida:

| Card | Variável | Unidade |
|---|---|---|
| 🌡️ Temperatura Ar | `temperatura` | °C |
| 🌡️ Temperatura Solo | `temperatura_solo` | °C |
| 💧 Umidade Ar | `umidade` | % |
| 💧 Umidade Solo | `umidade_solo` | % |
| ☀️ Luminosidade | `luminosidade` | lx |
| 🔵 pH Solo | `PH_solo` | — |

Quando o sensor está offline, todos os cards exibem `—` com opacidade reduzida.

### 2.4 Gráfico histórico — Últimas 24h

**Dados:** `fetchTelemetryHistory(canteiroId, 1)` chamado em paralelo com `fetchCurrentTelemetry`.

Exibe 3 séries num único gráfico de linha com eixo Y normalizado (0–100):

| Série | Cor | Normalização |
|---|---|---|
| Temp. Ar (°C) | Vermelho | Eixo 10–40 °C mapeado em % |
| Umidade Solo (%) | Verde | Direto |
| Luminosidade (norm. %) | Amarelo | `lux / 130.000 × 100` |

O gráfico usa `spanGaps: true` — lacunas de sensor offline não quebram a linha. O badge **"Inclui leitura atual"** aparece quando a leitura em tempo real foi appendada como último ponto.

### 2.5 Controle de bomba de irrigação

Card dedicado ao acionamento manual da bomba do canteiro selecionado:

| Estado | Visual | Botão |
|---|---|---|
| Inativa | Ícone cinza | Verde "Ligar bomba" |
| Ativa | Ícone pulsando, fundo esmeralda | Vermelho "Desligar bomba" |
| Sensor offline | Desabilitado | Tooltip explicativo |

**Implementação:** `src/features/irrigacao/services/irrigacaoService.js`  
**Endpoint:** `POST /api/v1/canteiros/{id}/bomba { ativo: true/false }`  
**Fallback:** se a API retornar 404, o estado é controlado localmente (mock).

### 2.6 Relatório semanal de irrigação

Visualização agregada com os dados de irrigação da última semana para todos os canteiros:

- **Gráfico de barras:** número de ciclos de irrigação por canteiro
- **Tabela:** ciclos + estimativa de litros consumidos (12 L/min × ciclos ativos)

**Dados:** `fetchWeeklyWaterReport()` — usa `fetchTelemetryHistory` por canteiro e conta os pontos com `status_bomba: true`.

### 2.7 Tendência de sessão

Gráfico de linha que acumula as leituras do polling em tempo real:

- **Intervalo:** 60 segundos
- **Capacidade:** até 60 pontos (~1 hora de sessão)
- **Buffer:** singleton de módulo (`_trendBuffer`) — sobrevive à navegação entre abas
- **Variáveis:** Temp. Ar (eixo °C) + Umidade Solo (eixo %)
- **Estado inicial:** spinner "Aguardando leituras…" até a primeira leitura

---

## 3. Fluxo de Dados

```
load() — chamada paralela:
  ├── fetchCurrentTelemetry(canteiroId)  → cards + banner + bomba
  ├── fetchTelemetryHistory(canteiroId, 1) → gráfico 24h
  └── fetchWeeklyWaterReport()           → relatório semanal

Polling (60s):
  └── fetchCurrentTelemetry(canteiroId)  → atualiza cards + trend buffer
```

---

## 4. Estados de Erro

| Situação | Comportamento |
|---|---|
| Falha no load inicial | `ErrorBlock` com código `HSM-TEL-002` + botão "Tentar novamente" |
| Sensor offline | Cards com `—`, banner vermelho, botão bomba desabilitado |
| Leitura suspeita | Banner âmbar, dados exibidos com aviso |
| Falha ao acionar bomba | Mensagem de erro inline no card da bomba |
| Sem histórico (API 404) | Fallback para mock; gráfico 24h exibe dados mockados |

---

## 5. Testes

**Arquivo:** `src/tests/PrincipalPage.test.jsx` — 10 testes:

| Teste | O que valida |
|---|---|
| exibe spinner ao carregar | Estado de loading |
| renderiza cards de métricas | 6 cards presentes após sucesso |
| exibe banner sensor online | Banner verde com texto correto |
| exibe banner offline | Banner vermelho quando status = offline |
| exibe gráficos históricos 24h | Canvas line-chart presente |
| exibe relatório semanal | Seção e dados de ciclos presentes |
| exibe ErrorBlock quando API falha | Mensagem de erro visível |
| exibe botão "Ligar bomba" | Botão presente quando bomba inativa |
| botão desabilitado quando offline | Disabled quando sensor offline |
| toggleBomba chamado com canteiro correto | Serviço invocado com parâmetros corretos |

---

## 6. Stack Técnica

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Hooks: useState, useEffect, useCallback, useRef |
| Chart.js + react-chartjs-2 | ^4.5 / ^5.3 | Gráfico 24h (Line) + relatório (Bar) + trend (Line) |
| chartjs-adapter-date-fns | ^3.0 | Eixo X temporal |
| Tailwind CSS | ^3.4 | Grid responsivo (1/2/3 colunas) |
| lucide-react | ^1.16 | Ícones de métricas e controles |
