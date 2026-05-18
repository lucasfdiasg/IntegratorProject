Ecrã: Histórico de Temperatura e Umidade (Últimas 24h)

1. Ecrã Escolhido e Justificativa

O ecrã selecionado para a Release 1 (Prova de Conceito E2E) foi o Histórico de Temperatura e Umidade.

Justificativa Técnica e Gestão de Risco:
A decisão de priorizar este ecrã baseou-se na mitigação de riscos técnicos (conforme as diretrizes arquiteturais A1.6 e A1.7). A visualização histórica é o alicerce de qualquer painel de controle de IoT. Ao implementarmos este ecrã primeiro, fomos obrigados a resolver os maiores desafios de desenvolvimento de uma só vez:

Validação do Motor de Gráficos: Implementar o Chart.js de forma responsiva utilizando HTML5 Canvas, garantindo que o gráfico se redimensione dinamicamente sem estourar as margens físicas da aplicação.

Camada de Consumo Abstrata: Estabelecer o padrão arquitetural de consumo de API por meio de uma camada de fetch isolada (telemetryService.js), facilitando a transição para chamadas reais no futuro sem alterar o visual.

Tratamento de Dados Incompletos: Resolver de imediato o comportamento visual de séries temporais que apresentam falhas pontuais (ex: sensores temporariamente offline).

Evitámos começar pelo ecrã de "Tempo Real" para adiar temporariamente a complexidade de conexões assíncronas persistentes (WebSockets) no Marco 1, focando em entregar um fluxo de renderização de dados robusto, testável e 100% defensável.

2. Interface e Responsividade (Visual Implementado)

A interface foi projetada utilizando uma abordagem Mobile-First, adaptando-se de forma fluida a três cenários de visualização:

Mobile (Dispositivos Móveis): A barra lateral de navegação (Sidebar) recolhe-se automaticamente e é substituída por um cabeçalho compacto com um botão de menu hamburguer. O gráfico reduz o limite máximo de rótulos do eixo X de forma a evitar a sobreposição de horários.

Tablet (Visualização Intermédia): O layout ajusta as margens e reorganiza os cards de métricas de resumo de forma centralizada.

Desktop (Ecrãs Largos): A Sidebar de navegação estende-se permanentemente na lateral esquerda, proporcionando acesso direto às funcionalidades, enquanto o gráfico utiliza 100% da largura útil restante.

3. Estados Visuais Cobertos (Robustez do Sistema)

O componente HistoryChart foi desenhado seguindo as exigências do requisito A1.6 para comportar-se como uma máquina de estados resiliente:

Estado

Elemento Visual

Comportamento Implementado

Carregamento (Loading)

Spinner dinâmico

Exibe um indicador circular de progresso (Loader2 animado da biblioteca lucide-react) enquanto a promessa assíncrona da API está pendente.

Sucesso (Dados)

Gráfico com duas linhas

Plota a variação das últimas 24 horas: Linha vermelha para a Temperatura (°C) e linha azul para a Umidade do Ar (%).

Erro de Conexão

Alerta vermelho + Botão CTA

Exibe uma caixa de aviso indicando falha na sincronização dos dados e fornece um botão para reiniciar o fluxo de fetch sem quebrar o DOM.

Sem Dados (Empty)

Ilustração neutra informativa

Caso a base esteja vazia, renderiza uma mensagem instruindo o usuário a verificar a instalação e o emparelhamento físico dos sensores da horta.

Sensor Offline

Banner de aviso + Lacuna

Se houver perda de sinal de leitura em uma janela temporal, exibe um banner amarelo no topo do gráfico. A curva não quebra, saltando o ponto nulo usando a propriedade spanGaps: true.

4. Estrutura de Mock e Plano de Migração

Formato de Dados (src/mocks/telemetry.mock.js)

A estrutura de dados simula um contrato JSON estrito, devolvendo um array de objetos contendo:

id (Identificador único sequencial)

timestamp (Estampa de tempo em formato ISO 8601)

temperatura_ar (Leitura numérica de temperatura)

umidade_ar (Percentagem de umidade atmosférica)

umidade_solo (Percentagem de umidade do substrato)

status (String de controle: "ok" ou "offline")

Os dados gerados reproduzem fielmente o ciclo circadiano diário (temperaturas mais quentes e secas durante o dia, clima mais frio e úmido no período noturno).

Plano de Migração para Produção

A camada de serviços foi completamente isolada do componente visual em src/services/telemetryService.js. Na Release 2, para substituir o mock pela integração real com o backend da horta, será necessário alterar apenas o corpo da função fetchTelemetryData:

// Substituição futura na Release 2:
export const fetchTelemetryData = async () => {
  const response = await axios.get('/api/telemetry?hours=24');
  return response.data;
};


O componente visual continuará a processar e exibir os dados exatamente da mesma forma, garantindo um acoplamento extremamente baixo.

5. Decisão de Stack (Frontend)

React 18: Fornece um motor de renderização baseado em componentes, facilitando o gerenciamento de estados assíncronos de forma previsível.

Chart.js & React-Chartjs-2: Biblioteca de gráficos de alto desempenho com suporte nativo a múltiplos eixos de coordenadas e tratamento elegante de pontos vazios (spanGaps).

Tailwind CSS (v3): Permite construir interfaces responsivas diretamente através de classes utilitárias no HTML/JSX, otimizando o carregamento visual sem dependência de folhas de estilo .css externas complexas.

Jest & React Testing Library: Framework de testes automatizados para validar a integridade dos 5 estados da interface perante alterações de código.