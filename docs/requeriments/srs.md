# Especificação de Requisitos de Software (SRS)

**Projeto:** Sistema de Monitoramento de Horta Comunitária Inteligente  
**Versão:** 0.1  

---

## 1. Requisitos Funcionais (FR)

### RF-001: Telemetria de Sensores (Edge para Nuvem)
**Descrição:** O nó sensor (ESP32) **DEVE** realizar a leitura dos sensores de umidade do solo e temperatura do ar e enviar o pacote de dados para a API REST via Wi-Fi.
**Prioridade:** Must Have
**Critério de Aceitação:** Ao energizar o circuito, o monitor serial do ESP32 deve exibir a leitura correta dos sensores e o banco de dados na nuvem deve registrar uma nova linha na tabela de histórico em até 10 segundos após o envio.

### RF-002: Acionamento Autônomo da Irrigação (Edge)
**Descrição:** O sistema embarcado **DEVE** acionar fisicamente o módulo relé (bomba d'água) imediatamente se a leitura do sensor capacitivo de solo cair abaixo do limite crítico configurado.
**Prioridade:** Must Have
**Critério de Aceitação:** Dado que o limite crítico é 40%, ao retirar o sensor do solo úmido e expô-lo ao ar, o GPIO conectado ao relé deve ir para nível ALTO em no máximo 5 segundos.

### RF-003: Proteção Contra Inundação por Falha
**Descrição:** O firmware do microcontrolador **NÃO DEVE** manter o relé da bomba acionado por um período contínuo superior a 5 minutos, independentemente da leitura do sensor.
**Prioridade:** Should Have
**Critério de Aceitação:** Ao forçar a leitura de umidade para 0% (sensor desconectado), a bomba deve ligar, mas o sistema de segurança (watchdog ou timer) deve forçar o desligamento da bomba exatamente aos 5 minutos de operação contínua.

### RF-004: Dashboard de Histórico (Web/App)
**Descrição:** O front-end web **DEVE** consumir a API de dados e exibir um gráfico em linha contendo o histórico de temperatura e umidade das últimas 24 horas.
**Prioridade:** Must Have
**Critério de Aceitação:** Ao carregar a página web, o gráfico deve renderizar os dados armazenados no banco sem erros, refletindo fielmente os horários e valores das medições.

---

## 2. Requisitos Não-Funcionais (NFR)

### NFR-001: Orçamento de Energia no Nó Sensor (Restrição Física)
**Descrição:** Para garantir autonomia caso opere com bateria/solar, em modo de inatividade (StandBy/Deep Sleep), o consumo de corrente do circuito ESP32 **DEVE** manter-se estritamente abaixo de **20 mA**.
**Categoria:** Performance / Hardware Constraint
**Critério de Aceitação:** Medição do circuito em bancada com um multímetro em série com a alimentação VCC durante o ciclo de *Deep Sleep* apresenta corrente < 20 mA.

### NFR-002: Eficiência de Payload de Rede
**Descrição:** O tamanho do pacote de dados (JSON) enviado pelo ESP32 via HTTP POST para a API **NÃO DEVE** exceder o tamanho absoluto de **256 bytes**.
**Categoria:** Eficiência / Performance
**Critério de Aceitação:** Análise do pacote HTTP gerado pelo ESP32 (via log de rede ou Wireshark) confirma que o *Content-Length* do body da requisição é <= 256 bytes.

### NFR-003: Resiliência de Conectividade (Modo Fallback)
**Descrição:** O nó sensor **DEVE** manter sua capacidade de decisão de irrigação local (*Edge Computing*) mesmo se a conexão Wi-Fi for perdida por um período superior a **3 minutos**.
**Categoria:** Confiabilidade / Tolerância a Falhas
**Critério de Aceitação:** Com o sistema funcionando, ao desligar o roteador Wi-Fi, o ESP32 deve tentar reconectar, mas caso a terra fique seca, o relé deve ser acionado normalmente pela lógica local, sem causar *crash* ou *loop* infinito no código tentando buscar a rede.

### NFR-004: Proteção Lógica de Rota (Segurança API)
**Descrição:** A API REST que recebe os dados de telemetria **NÃO DEVE** aceitar comandos `POST` ou `PUT` sem um *token* de autorização pré-compartilhado no cabeçalho (*Header*) da requisição.
**Categoria:** Segurança
**Critério de Aceitação:** Disparar uma requisição HTTP POST para a rota de inserção de dados via Postman sem o *Bearer Token* correto deve resultar obrigatoriamente em um erro `401 Unauthorized`.

### NFR-005: Estado de Falha Seguro (Fail-Safe Físico)
**Descrição:** O circuito elétrico de acionamento da bomba **DEVE** ser projetado utilizando o contato Normalmente Aberto (NA) do relé, garantindo que na ausência de sinal lógico do microcontrolador (queda de energia do ESP32 ou travamento), o circuito de potência permaneça fisicamente interrompido.
**Categoria:** Segurança / Eletricidade
**Critério de Aceitação:** Com a bomba em operação normal (relé atracado), ao cortar abruptamente a alimentação de 3.3V do ESP32, o relé deve desarmar instantaneamente, cortando a energia da bomba d'água.

### NFR-006: Timeout de Requisição HTTP
**Descrição:** O cliente HTTP do ESP32 **NÃO DEVE** aguardar mais de 5000 milissegundos (5 segundos) pela resposta da API REST. Caso o limite seja atingido, a requisição deve ser abortada (Timeout) para evitar o travamento do loop principal de controle da horta.
**Categoria:** Performance / Confiabilidade
**Critério de Aceitação:** Simulando um atraso de 6 segundos na resposta do servidor (via Mock na API), o ESP32 deve encerrar a conexão exatos 5 segundos após o envio do POST, registrando falha, mas continuando a leitura dos sensores sem travar.