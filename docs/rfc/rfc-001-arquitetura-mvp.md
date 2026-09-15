# RFC-001: Arquitetura do MVP — Horta Comunitária Inteligente

---

## Cabeçalho

| Campo     | Valor                                          |
|-----------|------------------------------------------------|
| Status    | Proposto                                       |
| Versão    | 0.1                                            |
| Autores   | Cleive, Lucas, Luís e Rafael                   |
| Data      | 2026-04-24                                     |
| Marco     | Marco 2 — Projetos conceituais aprovados       |
| Substitui | —                                              |

---

## 1. Contexto e Motivação

O sistema visa automatizar o monitoramento e a manutenção hídrica de canteiros comunitários, garantindo a sobrevivência das culturas mesmo em períodos de ausência humana. Ele é capaz de coletar dados ambientais em locais sem infraestrutura elétrica direta, utilizando energia solar e baterias. O cenário operacional envolve ambientes externos sujeitos a intempéries, exigindo que o sistema tome decisões locais de irrigação para proteger a saúde das plantas sem depender da rede.

---

## 2. Escopo deste Marco

**Dentro do escopo:**

- Nó de Campo autônomo baseado em ESP32 com rádio NRF24L01.
- Nó Base (Gateway) para ponte rádio-Wi-Fi e envio de JSON.
- Lógica de irrigação local (*Edge Computing*) por umidade.
- Proteção física contra falhas elétricas e inundações.

**Fora do escopo:**

- Controle de múltiplos setores de irrigação.
- IA preditiva para previsão de consumo de água.
- Autenticação multifator no dashboard.

---

## 3. Requisitos Atendidos

- SRS (A1.2): `docs/requirements/srs.md`
- Casos de Uso (A1.3): `docs/requirements/casos-de-uso.md`

**UCs críticos suportados:**

- **UC-01** — Coleta e Transmissão em Dois Estágios.
- **UC-02** — Irrigação Automática e Proteção de Tensão.
- **UC-03** — Comando Remoto do Dashboard.

---

## 4. Stack Tecnológica

| Camada         | Tecnologia       | Versão | Por quê                                          |
|----------------|------------------|--------|--------------------------------------------------|
| Nó de campo    | ESP32 DevKit V1  | -      | Padronização e suporte a Deep Sleep.             |
| Nó base        | ESP32 DevKit V1  | -      | Possui Wi-Fi nativo para ponte REST.             |
| Comunicação    | NRF24L01         | 2.4GHz | Baixo consumo entre nós sem usar Wi-Fi.          |
| Backend / API  | Python (FastAPI) | 3.10   | Alta performance e integração com IA.            |
| Banco de Dados | PostgreSQL       | 15.x   | Persistência robusta de histórico.               |
| Interface      | Streamlit        | 1.30+  | Prototipagem rápida para visualização.           |

---

## 5. Arquitetura do Sistema

### 5.1 Diagrama de Componentes

```mermaid
flowchart TB
  subgraph Campo [Nó de Campo - Bateria/Solar]
    S1[Sensores] -- Analog --> MC1[ESP32]
    MC1 -- SPI --> R1[NRF24L01]
    MC1 -- GPIO --> RL[Relé + Bomba]
  end

  subgraph Base [Nó Base - Gateway]
    R2[NRF24L01] -- SPI --> MC2[ESP32]
    MC2 -- Wi-Fi --> API[FastAPI Backend]
  end

  subgraph Nuvem [Cloud Infra]
    API -- SQL --> DB[(PostgreSQL)]
    DS[Streamlit] -- HTTP --> API
  end

  R1 <.. Radio ..> R2
```

### 5.2 Fluxo de Dados (Cenários)

#### Cenário 1: Ciclo de Telemetria e Economia de Energia

1. O Nó de Campo desperta do *Deep Sleep* e lê os sensores.
2. O dado é enviado via rádio NRF24L01 para o Nó Base.
3. O Nó Base (ESP32) recebe o pacote e envia um POST para a API.
4. O Nó de Campo recebe o ACK e volta a dormir por 15 minutos.

#### Cenário 2: Acionamento Local por Falha de Rede

1. O Nó de Campo identifica umidade abaixo de 40%.
2. Detecta falha de conexão e ativa o modo *Fallback*.
3. O microcontrolador aciona o módulo MT3608 e o relé.
4. A bomba desliga pelo timer de segurança do firmware.

### 5.3 Fronteiras e Responsabilidades

| Componente  | Responsável por                                | NÃO faz                                          |
|-------------|------------------------------------------------|--------------------------------------------------|
| Nó de Campo | Leitura de sensores e controle físico da bomba | Não se comunica diretamente com a Internet.      |
| Nó Base     | Ponte de rádio para Wi-Fi e buffer de comandos | Não toma decisões de irrigação autonôma.         |
| Backend API | Validação e persistência de dados              | Não realiza processamento de interface gráfica.  |

---

## 6. Decisões de Arquitetura (ADRs)

### ADR-001: Comunicação Rádio vs Wi-Fi no Campo

**Status:** Aceito. O rádio NRF24L01 consome menos de 15mA em transmissão, enquanto o Wi-Fi do ESP32 pode atingir picos de 200mA, o que inviabilizaria o uso de baterias 18650 por longos períodos.

### ADR-002: Lógica de Irrigação Distribuída (Edge)

**Status:** Aceito. A decisão de ligar a bomba ocorre no Nó de Campo. Isso evita que, em caso de queda de internet, a planta morra ou a bomba fique ligada infinitamente por falta de comando de desligamento.

---

## 7. Telas (Wireframes)

### 7.1 Tela 1 — Dashboard (UC-01)

### 7.2 Tela 2 — Histórico (UC-01)

### 7.3 Tela 3 — Controle Manual (UC-03)

### 7.4 Tela 4 — Configurações (UC-02)

---

## 8. Riscos e Mitigações

| Risco         | Probabilidade | Impacto | Mitigação                                        |
|---------------|---------------|---------|--------------------------------------------------|
| Esgotamento   | Média         | Alto    | Aborto de irrigação se VBat < 3.5V.              |
| Travamento    | Baixa         | Crítico | Uso de Watchdog e contato NA no relé.            |
| Interferência | Média         | Médio   | Implementação de retentativas com ACK no rádio.  |

---

## 9. Fora do Escopo / Próximos Passos

- Integração com sensores de nutrientes (NPK).
- Detecção de pragas via imagem.
- Migração para rede LoRa em versões futuras.

## Referências
