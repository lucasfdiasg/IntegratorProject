Notas de Release (Pull Request) - Release 1.0.0

1. Objetivo da Release

Esta versão consolida a primeira entrega funcional ponta a ponta (E2E Frontend) do sistema da Horta Comunitária Inteligente. O objetivo central é estabelecer e validar a arquitetura da aplicação, os padrões de UI/UX, o tratamento de estados e a estratégia de testes unitários automatizados, mitigando riscos técnicos antes de avançar para as demais telas da aplicação.

2. Escopo da Implementação

A tela de Histórico de Telemetria foi desenvolvida integralmente, descartando textos de preenchimento provisórios e adotando fluxos de dados lógicos.

2.1. Simulação de Dados Realistas

Desenvolvimento do gerador dinâmico de telemetria (telemetry.mock.js), que calcula curvas térmicas e de umidade orgânicas coerentes com variações ambientais reais ao longo do dia.

Contrato de dados idêntico ao modelo físico final que será enviado pelo microcontrolador ESP32.

2.2. Tratamento dos 5 Estados de Robustez

Assegurando o cumprimento da especificação técnica A1.6 (Robustez e Resiliência), a tela adapta-se e responde visualmente a cinco cenários distintos do sistema:

Sucesso: Renderização interativa do histórico com duplo eixo Y.

Carregamento: Indicador visual animado (Spinner) de feedback imediato ao usuário.

Falha de Conexão: Alerta amigável de erro de conexão com botão de recarga que reinsere o componente na árvore do React.

Sensor Offline: Exibição contínua dos dados existentes, omitindo as falhas de leitura temporárias e disparando um alerta com o timestamp do último sinal capturado.

Sem Dados (Empty State): Amortecimento de experiência visual para bancos de dados vazios.

2.3. Testes Automatizados (SCM & QA)

Criação do arquivo de suíte de testes HistoryChart.test.js sob a tutela do Jest e React Testing Library.

Os testes validam o comportamento do componente sob os 5 estados lógicos obrigatórios, assegurando que alterações futuras no layout não provoquem quebras lógicas.

3. Decisões Arquiteturais e Padrões (A1.4, A1.5, A1.6)

Isolamento de Responsabilidades: Toda a lógica de fetch reside no serviço (telemetryService.js). O componente visual não sabe se os dados são reais ou simulados, facilitando a troca posterior.

Estilização Integrada: Adoção do Tailwind CSS v3 estável, prevenindo conflitos com as dependências do ecossistema de compilação rápida do Vite.

Prevenção de Memory Leaks: Uso de flags de montagem assíncronas no React (isMounted) para impedir atualizações de estado em componentes desmontados da tela.

4. Instruções de Execução Local

Siga as etapas abaixo para rodar e avaliar este projeto localmente:

Pré-requisitos

Ter o Node.js (versão LTS recomendada) instalado no seu computador.

Rodar a Aplicação

Aceda à pasta do projeto no seu terminal:

cd dashboard-horta


Instale as dependências declaradas no package.json:

npm install


Inicie o servidor de desenvolvimento do Vite:

npm run dev


Abra o navegador:

Aceda ao link fornecido (geralmente http://localhost:5173/).

Utilize o painel de Dev Control no topo da tela para transitar instantaneamente entre os 5 estados da aplicação e validar a sua resiliência.

Executar os Testes Automatizados

Para rodar a suíte de testes com o Jest e validar a cobertura dos cenários, digite no terminal:

npm test
