# NEXUS: O Painel de Controle Integrado de Vida (Life OS & Personal Cockpit)

> **Documento de Visão Estratégica & Arquitetura Conceitual**  
> **Autor:** Samuel Cancelier & Antigravity AI  
> **Objetivo:** Unificar aplicativos de rotina, investimentos, anotações e objetivos de vida em um único ecossistema integrado e inteligente.

---

## 1. O Manifesto: O Fim da Fragmentação Digital

Hoje, uma pessoa produtiva vive dividida entre 5 a 10 aplicativos diferentes:
* Um app para investimentos e ações.
* Um app ou planilha para orçamento diário.
* Um app para rotina e hábitos.
* O Google Agenda para compromissos.
* Um app de anotações (Notion, Keep, Obsidian).
* Um bloco de notas para metas de longo prazo.

**O problema:** esses aplicativos não conversam entre si. O seu app de investimentos não sabe que você teve uma semana exaustiva de treinos; o seu app de anotações não sabe quais são suas metas financeiras do mês; e a sua agenda não sabe quanto custa cada hora do seu tempo.

**A Solução (NEXUS):** Um **Cockpit Pessoal Centralizado**. Uma tela única onde a sua vida inteira converge. Um painel executivo com telemetria em tempo real, onde cada área alimenta a outra e um único assistente de inteligência artificial (Gemini) enxerga você em 360 graus.

```
                      ┌─────────────────────────────────┐
                      │    NEXUS: CENTRAL COMMAND DECK   │
                      │  (Painel Web / Mobile / Tablet) │
                      └───────────────┬─────────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│  MÓDULO 01   │              │  MÓDULO 02   │              │  MÓDULO 03   │
│   ROTINA &   │              │ INVESTIMENTOS│              │ SEGUNDA MENTE│
│    HÁBITOS   │              │  & FINANÇAS  │              │ (NOTAS & IDEIAS)
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       └─────────────────────────────┼─────────────────────────────┘
                                     ▼
                      ┌──────────────────────────────┐
                      │     CO-PILOTO IA (GEMINI)    │
                      │   Cruzamento Multidisciplinar │
                      │   Decisões Baseadas em Dados │
                      └──────────────────────────────┘
```

---

## 2. Os Módulos do Sistema Integrado

### Módulo 1: O Motor de Rotina & Saúde (Já Construído no v2.0)
* **Origem:** O app de rotina atual (`rotina-metas-web.pages.dev`).
* **Telemetria:** Aderência de treinos, horas de estudo, páginas lidas, pontuação semanal.
* **Integração de Agenda:** Sincronização direta com Google Agenda, separando hábitos de eventos normais.
* **Evolução Futura:**
  * Integração com smartwatches/bandas cardíacas (Garmin, Apple Health, Google Fit) para registrar automaticamente calorias, sono e recuperação física.

### Módulo 2: O Cockpit Financeiro & Investimentos
* **Origem:** Seus aplicativos e planilhas de investimentos atuais.
* **Métricas Principais na Tela:**
  1. **Patrimônio Líquido Total:** Atualizado em tempo real (Renda Fixa, Ações, FIIs, Cripto, Caixa).
  2. **Taxa de Poupança do Mês:** Quanto da sua receita líquida você realmente guardou e aportou.
  3. **Renda Passiva Mensal (Dividendômetro):** Projeção e histórico de dividendos e juros recebidos.
  4. **Runway (Autonomia de Sobrevivência):** Quantos meses ou anos você vive com o patrimônio atual caso pare de trabalhar hoje.
* **Cruzamento com Objetivos de Vida:**
  * Metas de curto, médio e longo prazo atreladas a contas específicas (ex: "Viagem 2027", "Independência Financeira", "Equipamento Novo").

### Módulo 3: A Segunda Mente (Second Brain - Notas, Ideias e Projetos)
* **Captura Rápida (Quick Capture):**
  * Uma barra de digitação sempre acessível (ou botão de áudio rápido). Você fala ou digita uma ideia e o sistema arquiva no local correto.
* **Projetos Ativos (ex: FEIT, Expansão Profissional):**
  * Status dos projetos estratégicos em cards simples: O que está em andamento, próximos passos e bloqueios.
* **Documentos Vivos de Princípios:**
  * Seus valores inegociáveis, aprendizados de erros passados, listas de livros lidos e lições de vida.

### Módulo 4: Monitor de Objetivos de Vida & Gamificação
* O sistema de "Prêmios" que já iniciamos na rotina ganha poder real:
  * Você só desbloqueia um gasto de lazer caro se cumprir a meta de saúde da semana E a meta de aporte do mês.
  * O sistema impede a autossabotagem: a recompensa passa a ser fruto real de disciplina comprovada por dados.

---

## 3. O Superpoder: Cruzamento Multidisciplinar com o Gemini

Nenhum aplicativo do mercado faz isso porque eles são ilhas isoladas. Com o NEXUS unificado, o seu Gemini passa a ter a visão completa da sua realidade:

### Cenários Práticos de IA Multidisciplinar:

#### Cenário A: Disciplina Financia o Prazer
> **Gemini:** *"Samuel, vi que você completou 100% dos treinos de musculação e corrida nas últimas duas semanas, e o seu módulo de investimentos fechou o mês com R$ 500 acima da meta de aporte. O seu prêmio de 'Jantar Especial / Compra Pessoal' está oficialmente liberado no painel!"*

#### Cenário B: Ajuste Fisiológico Baseado na Agenda
> **Gemini:** *"Analisando sua agenda de amanhã, você tem 5 horas de reuniões de trabalho consecutivas. Seu histórico mostra que dias com mais de 4 reuniões aumentam a chance de faltar ao treino noturno em 70%. Sugestão: agendei um bloco de 30 minutos de treino de mobilidade pela manhã e empurrei o estudo pesado para o fim de semana."*

#### Cenário C: Eficiência de Custo x Tempo
> **Gemini:** *"Neste mês, você investiu 12 horas no projeto X e o retorno financeiro foi Y. Comparado ao projeto FEIT, o retorno por hora investida no FEIT foi 3x maior. Recomendo realocar 4 horas semanais da sua rotina para o FEIT no próximo mês."*

---

## 4. Experiência de Usuário e Design (A Estética)

### 4.1 "Cockpit Dark Modern"
* Inspirado em interfaces de controle de missão, Bloomberg Terminal moderno e carros esportivos elétricos:
  * Fundo ultra-escuro (`#080808` / `#0d1117`).
  * Indicadores de status com luzes discretas (Verde Neon para metas batidas, Âmbar para atenção, Ciano para foco/estudos).
  * Sem poluição visual: tipografia limpa, fontes monoespaçadas para números e gráficos vetoriais leves.

### 4.2 Modos de Visualização

1. **Modo Smartphone (PWA Diário - O Dia a Dia):**
   * Tela inicial compacta: 3 cards principais:
     1. O que fazer hoje (check-in de rotina).
     2. Dinheiro do dia / Aporte do mês.
     3. Caixa de captura rápida de notas.

2. **Modo Desktop / Monitor Secundário (A "Central de Comando"):**
   * Layout de painel de controle que pode ficar aberto na sua segunda tela no trabalho ou num tablet na mesa:
     * Lado esquerdo: Agenda do dia e progresso dos hábitos.
     * Centro: Metas da semana, score consolidado e chat rápido com o Gemini.
     * Lado direito: Radar financeiro (evolução patrimonial, dividendos do mês) e projetos ativos.

3. **Entrada "Omnichannel" (Fale com o Sistema de Qualquer Lugar):**
   * Você está na rua e não quer abrir o app?
   * Mande um áudio no Telegram/WhatsApp ou abra o assistente de voz do celular:
     > *"Gastei 42 reais na farmácia e corri 6km na volta."*
   * O Gemini processa o texto, chama a API do NEXUS e atualiza automaticamente:
     * Lança R$ 42 na categoria Saúde/Farmácia do módulo financeiro.
     * Marca a corrida de 6km como "Feita" no módulo de rotina!

---

## 5. Arquitetura Técnica & Como o Antigravity Conecta Tudo

O Antigravity é a ferramenta ideal para construir e manter esse ecossistema porque ele tem capacidade de **navegar entre múltiplos projetos** e entender como cada pedaço de código se comunica.

```
                  ┌───────────────────────────────┐
                  │    ANTIGRAVITY WORKSPACE      │
                  │   (Lê e orquestra todos os    │
                  │        projetos locais)       │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Projeto Rotina  │    │  Projeto Finanças│    │ Projeto Anotações│
│(Worker/Firestore)│    │   (APIs/Banco)   │    │  (Markdown/JSON) │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                  ┌───────────────────────────────┐
                  │    NEXUS API GATEWAY (EDGE)   │
                  │   (Cloudflare Workers / Auth) │
                  └───────────────┬───────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │      FRONTEND UNIFICADO       │
                  │  (React / Tailwind / PWA)     │
                  └───────────────────────────────┘
```

### 5.1 O Segredo: Microsserviços Simples e Desacoplados
Em vez de construir um monstro gigante difícil de manter, a estratégia inteligente é:
1. **Cada projeto mantém sua independência:**
   * O app de rotina tem seu próprio banco e sua API (já fizemos isso com o Cloudflare Worker e Firestore).
   * O app de investimentos terá a sua API e seu banco (seja SQLite, Postgres, Firebase ou planilhas sincronizadas).
   * O app de notas terá seus arquivos em Markdown ou banco leve.
2. **O NEXUS é apenas a camada de apresentação e inteligência:**
   * Ele não precisa reinventar a lógica de cálculo de cada app; ele apenas consome as APIs existentes de cada um e plota os dados juntos.
   * Se um app quebrar ou mudar, os outros continuam funcionando normalmente.

---

## 6. Roadmap Prático de Implementação

### Fase 1: Fundação do Módulo de Rotina (100% Concluída ✅)
* App de rotina moderno em produção na Cloudflare.
* API serverless com autenticação e banco na nuvem.
* Leitura em tempo real do Google Agenda.
* Integração de relatórios com o Gemini.

### Fase 2: Estruturação dos Seus Outros Apps (Investimentos e Notas)
* Identificar os repositórios/pastas onde estão seus apps de finanças e investimentos.
* Usar o Antigravity para criar ou expor rotas REST simples nesses projetos (ex: `GET /api/patrimonio`, `GET /api/aportes-mes`).
* Garantir que os dados possam ser lidos com autenticação segura.

### Fase 3: Criação do Frontend do NEXUS
* Inicialização do repositório central `nexus-dashboard`.
* Criação do layout Dark Mode responsivo (Mobile + Desktop Cockpit).
* Acoplamento do Módulo 1 (Rotina) e Módulo 2 (Investimentos) lado a lado na mesma tela.

### Fase 4: O Cérebro Unificado (Gemini 360°)
* Criação do endpoint `GET /api/nexus/snapshot-vida`: uma única rota que reúne em um JSON enxuto toda a situação do seu dia (rotina, dinheiro, compromissos).
* Configuração do assistente pessoal com instruções avançadas para cruzar todos esses dados e orientar suas decisões com precisão cirúrgica.

---

> *"O melhor jeito de prever o futuro é construí-lo com sistemas simples que conversam entre si."*
