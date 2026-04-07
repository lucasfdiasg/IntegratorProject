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

## 3. Especificação Comportamental (Casos de Uso)

Abaixo estão descritos os fluxos comportamentais do sistema, mapeando o caminho feliz e, prioritariamente, os mecanismos de recuperação e sobrevivência a falhas físicas, elétricas e de rede.

### UC-01: Coleta e Transmissão em Dois Estágios (Rádio NRF24L01 + Wi-Fi)
*ID:* UC-01  
*Ator Principal:* Nó de Campo (Microcontrolador local + NRF24L01) e Nó Base (ESP32 + Wi-Fi)  
*Pré-condições:* Nó de campo alimentado pelas baterias 18650; Sensores (HM-390, DHT22 e LDR) conectados; Módulos NRF24L01 pareados; ESP32 base conectado à internet.

*Fluxo Principal:*
1. O Nó de Campo desperta e realiza a leitura dos sensores (HM-390 para umidade do solo, DHT22 para ar, LDR para luz).
2. O Nó de Campo verifica o nível de tensão da bateria local (via divisor de tensão).
3. O Nó de Campo empacota os dados e transmite via rádio (NRF24L01) para o Nó Base.
4. O Nó Base (ESP32) recebe o pacote via rádio e formata um JSON.
5. O Nó Base conecta à API REST via Wi-Fi e envia o HTTP POST.
6. O Backend valida e armazena os dados, retornando 201 Created.
7. O Nó de Campo entra em Deep Sleep para poupar a bateria.

*Fluxos Alternativos:*
* *A1 (Falha de Wi-Fi no Nó Base):* No passo 5, se o ESP32 Base estiver sem Wi-Fi, ele responde ao Nó de Campo via rádio com um sinal de "Recebido, mas Offline". O Nó Base guarda a leitura em sua memória flash local para envio posterior, e o Nó de Campo volta a dormir normalmente.

*Fluxos de Exceção (Robustez):*
* *E1 (Interferência de Rádio/Perda de Pacote):* No passo 3, se o Nó de Campo enviar os dados e não receber o Acknowledge (ACK) do NRF24L01 base em 200ms, ele tenta retransmitir até 3 vezes. Se falhar, ele salva o dado localmente e dorme, evitando drenar a bateria tentando achar sinal.
* *E2 (Leitura Corrompida dos Sensores):* No passo 1, se o DHT22 retornar NaN ou o LDR der leitura fora do range resistivo (0 a 1MOhms indicando cabo rompido), o Nó de Campo envia o pacote com a flag "status": "erro_sensor", alertando o Dashboard sobre a necessidade de manutenção física.

*Pós-condições:* Dados armazenados no banco OU alerta de falha de comunicação/hardware registrado.

---

### UC-02: Irrigação Automática e Proteção de Tensão (MT3608)
*ID:* UC-02  
*Ator Principal:* Nó de Campo (Controle Local)  
*Pré-condições:* Bateria 18650 com carga suficiente; Módulo MT3608 operante; Limite crítico de umidade (ex: < 40%) atingido no sensor HM-390.

*Fluxo Principal:*
1. O Nó de Campo identifica, via sensor HM-390, que o solo está seco.
2. O Nó de Campo afere a tensão da bateria e confirma que é suficiente (> 3.5V).
3. O Nó de Campo aciona o pino digital conectado ao módulo relé de 5V.
4. O módulo MT3608 eleva a tensão para 5V, atracando o relé e ligando a mini bomba d'água.
5. A bomba opera por 30 segundos preenchendo a mangueira de silicone.
6. O Nó de Campo desliga o relé e envia um pacote via NRF24L01 informando "Irrigação Concluída".

*Fluxos Alternativos:*
* *A1 (Bateria Baixa / Dia Nublado):* No passo 2, se a tensão da bateria estiver abaixo de 3.5V (o painel solar não carregou via TP4056 por falta de sol), o Nó de Campo aborta o acionamento da bomba para evitar o desligamento abrupto do microcontrolador (brownout) e envia um log de "Bateria Baixa - Irrigação Adiada".

*Fluxos de Exceção (Robustez):*
* *E1 (Falha no Boost MT3608):* No passo 4, se o MT3608 falhar em entregar os 5V, o relé não irá atracar. O microcontrolador registrará a ação de irrigação (após 30s), mas o sensor HM-390 não mostrará aumento de umidade nas leituras seguintes. Se após 2 ciclos de irrigação a umidade não subir, o sistema acusa "Falha Hidráulica/Elétrica" e entra em modo de segurança.
* *E2 (Timeout Físico da Bomba):* Se o microcontrolador travar durante o passo 5, um Watchdog Timer de hardware reseta a placa após 60 segundos, desarmando automaticamente os pinos do relé para não esgotar a água do reservatório ou queimar a bomba.

*Pós-condições:* Solo irrigado com segurança elétrica garantida OU irrigação abortada para proteção da bateria.

---

### UC-03: Comando Remoto do Dashboard com Latência de Rede
*ID:* UC-03  
*Ator Principal:* Usuário e Infraestrutura de Rede  
*Pré-condições:* Usuário logado na plataforma; Relé da bomba operante.

*Fluxo Principal:*
1. O usuário visualiza o painel e clica em "Irrigar Canteiro 1" no Dashboard.
2. O Backend registra o comando e aguarda o próximo check-in do ESP32 Base.
3. O ESP32 Base faz a requisição Wi-Fi GET, recebe o comando e repassa via rádio (NRF24L01) para o Nó de Campo.
4. O Nó de Campo aciona o relé da bomba via módulo MT3608.
5. O Nó de Campo confirma a execução via rádio para o Nó Base.
6. O Nó Base atualiza a API com o status "Concluído".
7. O Dashboard atualiza a tela do usuário.

*Fluxos de Exceção (Robustez):*
* *E1 (Nó de Campo em Deep Sleep):* No passo 3, como o Nó de Campo alimentado por bateria passa a maior parte do tempo dormindo, o ESP32 Base enfileira o comando. O Dashboard exibe ao usuário: "Comando agendado. A irrigação iniciará no próximo despertar do sensor."
* *E2 (Perda de Comunicação com o Campo):* Se o ESP32 Base possuir o comando, mas o Nó de Campo não responder via rádio após 3 tentativas de despertar, o ESP32 Base devolve erro 503 Service Unavailable - Rádio Offline para a API, e o Dashboard alerta o usuário sobre possível falha física (bateria esgotada ou conduíte rompido).

*Pós-condições:* Comando executado em campo e estado sincronizado na nuvem, respeitando os ciclos de energia e limitações de hardware.
