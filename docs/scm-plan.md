# Plano de Gerenciamento de Configuração de Software (SCM)

**Documento:** `docs/scm-plan.md`  
**Projeto:** Horta Comunitária Inteligente

Este documento define as políticas de controle de versão e colaboração técnica da equipe.

---

## 1.1 Política de Branching

### Modelo Adotado: GitHub Flow

O modelo escolhido foi o **GitHub Flow** para organizar o fluxo trabalho.

Diferente do GitFlow, que exige a gestão complexa de múltiplas branches de longa duração (como *develop* e *release*), o GitHub Flow foca na simplicidade e na entrega contínua. Como o nosso projeto demanda integrações frequentes de sensores e ajustes de interface, este modelo permite que cada nova funcionalidade seja testada e integrada à branch principal rapidamente, mantendo a `main` sempre em estado estável e pronto para deploy.

### Nomes de Branch Permitidos

As branches devem seguir obrigatoriamente os prefixos abaixo:

- `feature/<descrição>`: Para o desenvolvimento de novas funcionalidades.
- `fix/<bug>`: Para correções de erros ou bugs encontrados.
- `docs/<descrição>`: Para alterações exclusivas em documentações técnicos.
- `refactor/<descrição>`: Para melhorias no código que não alteram a lógica de negócio.
- `style/<descrição>`: Para mudanças que não afetam o sentido do código (Ex. formatação).
- `test/<descrição>`: Para adição ou correção de testes.
- `chore/<descrição>`: Para tarefas de manutenção como atualizar dependências.

### Regras de Merge em main

O merge para a branch `main` só é permitido através de Pull Requests aprovados. Membros da equipe não devem realizar commits diretamente na `main` para evitar a quebra da integridade do código em produção.

---

## 1.2 Proteção da Branch main

As seguintes regras devem ser configuradas no repositório do GitHub (`Settings → Branches → Branch protection rules`):

- Pull Request obrigatório: É proibido o push direto. Toda alteração deve passar pelo processo de revisão.
- Mínimo de 2 aprovações: Definimos duas aprovações como obrigatórias, para aumentar o rigor de inspeção de código e garantir que ao menos 75% da equipe esteja ciente do fluxo de trabalho e das alterações feitas. Com isso diminuímos um pouco a agilidade para ganhar em segurança.
- Status checks obrigatórios (CI): O merge só será habilitado se o workflow de Integração Contínua (Linter e testes básicos) retornar sucesso.
- Histórico linear: É obrigatório o uso de *Squash and Merge* para manter o histórico da `main` limpo e sem commits de merge intermediários.
- Bloqueio de Force Push: Impede que o histórico da branch principal seja sobrescrito acidentalmente.

---

## 1.3 Convenção de Commits

A equipe segue o padrão **Conventional Commits**.

- **Especificação:** [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/)

### Exemplos Reais para o Projeto

1. `feature(sensor): adiciona integração com sensor de umidade DHT22`

- Configura os pinos de entrada para leitura analógica
- Implementa a função de conversão de dados do sensor
- Adiciona logs de monitoramento para debug no terminal

Ref: #42

1. `feature(ui): implementa barra de progresso no carregamento de dados`

- Adiciona componente visual de carregamento (Spinner)
- Integra o estado da barra com a resposta da API do servidor
- Melhora o feedback visual para o usuário durante consultas longas

Ref: #25

1. `fix(controller): corrige erro de timeout na conexão serial`

- Ajusta o baud rate para 9600 para garantir estabilidade
- Implementa um delay de 2 segundos na inicialização do sistema
- Resolve falha que impedia o reconhecimento da porta COM no Windows

Ref: #12

---

## 1.4 Definição de "Pronto" (DoD) para um PR

Todo Pull Request deve cumprir obrigatoriamente os seguintes itens antes de ser finalizado:

- [ ] A descrição do PR explica claramente o "porquê" da mudança.
- [ ] O código segue o guia de estilo definido (passou no Linter).
- [ ] Pelo menos 2 revisores aprovaram as alterações.
- [ ] O PR está vinculado a uma Issue ou User Story (UC) específica.
- [ ] A documentação foi atualizada caso a mudança afete contratos de API ou a arquitetura.
- [ ] O código abrange os critérios de aceitação descritos na SR, e foi validado em teste de bancada ou software.

---

## 1.5 Papéis

As responsabilidades de SCM estão divididas da seguinte forma:

- Revisar PRs: Todos os desenvolvedores da equipe têm a responsabilidade e devem revisar os PRs de seus colegas.
- Mergear em main: O responsável por realizar o merge após obter a aprovação e garantir que os checks de CI passaram será Lucas Dias.
- Manter o CI: O responsável pela infraestrutura/DevOps da equipe será Cleive Costa, garantindo que os scripts de automação (GitHub Actions) estejam operacionais.
