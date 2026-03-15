# Métricas de Engenharia

Para garantir a saúde do projeto e evitar o "efeito silo" (onde hardware e software não se integram), acompanharemos as seguintes métricas:

### 1. Métrica de Fluxo: Lead Time for Changes
* **Definição:** O tempo decorrido entre o primeiro commit de uma nova *feature* (ex: leitura de novo sensor) e o seu *merge* bem-sucedido na branch `main`.
* **Como Coletar:** Medição nativa pelo histórico de Pull Requests do GitHub (data de abertura vs. data de merge).

### 2. Métrica de Qualidade: Taxa de Falha de Integração (Post-Merge Defect)
* **Definição:** Quantidade de vezes que a branch `main` "quebra" após um PR ser aprovado (ex: o código compila no software, mas dá *kernel panic* ao ser gravado no ESP32 real).
* **Como Coletar:** Contagem manual de *hotfixes* necessários na `main` durante as sessões de laboratório.