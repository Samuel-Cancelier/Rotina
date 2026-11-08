# NEXUS: O Painel de Controle Integrado de Vida (Life OS & Personal Cockpit)

> **Documento de Visão Estratégica & Arquitetura Conceitual (v2 — Revisado para Custo Zero)**  
> **Autor:** Samuel Cancelier & Antigravity AI  
> **Especificação Técnica Completa para Desenvolvimento:** Veja [`SPEC_NEXUS_ARQUITETURA_IA.md`](file:///c:/Users/samue/Documents/meus%20Apps/nexus/SPEC_NEXUS_ARQUITETURA_IA.md)  
> **Objetivo:** Unificar em **um único aplicativo e um único banco de dados (R$ 0,00/mês)** os sistemas de Rotina, Investimentos B3, Leitor de Notas Fiscais (NFC-e) e Segunda Mente (Anotações integradas ao Google Docs), conectados ao aplicativo oficial do Gemini.

---

## 1. O Manifesto: O Fim da Fragmentação Digital

Hoje, os seus dados e ferramentas estão divididos em projetos separados:
* **App de Rotina (`Rotina`):** React + Cloudflare Worker + Firestore (`rotina-94433`).
* **Painel de Investimentos B3 (`investimentos_pessoais`):** Python/Streamlit rodando localmente no PC.
* **Leitor de Notas Fiscais SEFAZ-PR (`leituras_notas_fiscais`):** Python/Flask hospedado no Render com outro banco Firestore (`app-nota-fiscal-495214`).
* **Anotações e Ideias:** Espalhadas sem um painel central conectado aos objetivos.

**A Solução (NEXUS):** Fundir a inteligência e o código desses sistemas em **uma única aplicação web/mobile (PWA)** e **uma única base de dados no Firestore**, eliminando o Render e o servidor Python local.

```
                      ┌─────────────────────────────────────────┐
                      │        NEXUS: CENTRAL COMMAND DECK       │
                      │    (Aplicação Única Web / Mobile PWA)    │
                      └────────────────────┬────────────────────┘
                                           │
     ┌─────────────────────────┬───────────┴───────────┬─────────────────────────┐
     ▼                         ▼                       ▼                         ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  MÓDULO 01   │        │  MÓDULO 02   │        │  MÓDULO 03   │        │  MÓDULO 04   │
│   ROTINA &   │        │ INVESTIMENTOS│        │ NOTAS FISCAIS│        │ SEGUNDA MENTE│
│    AGENDA    │        │  B3 & METAS  │        │ (SEFAZ NFC-e)│        │ (GOOGLE DOCS)│
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                       │                       │
       └───────────────────────┴───────────┬───────────┴───────────────────────┘
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │     BANCO ÚNICO (FIREBASE FIRESTORE)    │
                      │  + PONTE AUTOMÁTICA GOOGLE DOCS/DRIVE   │
                      │   Lido Nativamente pelo App do Gemini   │
                      └─────────────────────────────────────────┘
```

---

## 2. Os 4 Módulos do Sistema Unificado

### Módulo 1: Motor de Rotina, Hábitos & Agenda
* **Base:** Código já validado do projeto `Rotina`.
* **Funcionalidades:** Check-in diário de hábitos, leitura direta do Google Agenda via tags `[Tag]`, pontuação semanal ponderada por pilares e controle de consistência.
* **Backlog Opcional (Baixíssima Prioridade):** Integração futura indireta com Smartwatch Xiaomi (via Alexa → Google Calendar/Tasks), apenas se desejado no futuro, fora do foco principal.

### Módulo 2: Cockpit Financeiro & Investimentos B3
* **Base:** Lógica portada do projeto `investimentos_pessoais` (`b3_parser.py`, `analytics.py`, `market_data.py`).
* **Funcionalidades no App:**
  1. Upload direto do extrato da B3 (`.xlsx` / `.csv`) pelo navegador, salvando snapshots históricos no Firestore.
  2. **Patrimônio Líquido Total:** Ações, FIIs, Renda Fixa, Tesouro Direto, análise de vencimentos, IR regressivo e risco FGC.
  3. **Renda Passiva Mensal (Dividendômetro)** e comparativo da carteira contra o CDI Líquido.
  4. **Rebalanceamento Inteligente:** Onde alocar o próximo aporte mensal.

### Módulo 3: Leitor de Notas Fiscais (NFC-e SEFAZ-PR) & Gastos Reais
* **Base:** Lógica portada do projeto `leituras_notas_fiscais` (`sefaz.py`, `categorias.py`, `repositorio.py`), saindo do Render e passando a rodar de graça no Cloudflare Worker do NEXUS.
* **Funcionalidades no App:**
  1. **Scanner de QR Code pelo Celular:** Aponta a câmera para a nota fiscal do mercado/farmácia, o Worker lê a SEFAZ-PR, extrai todos os itens e categoriza tudo sozinho (Açougue, Hortifruti, Limpeza, Farmácia, etc.).
  2. **Alimentação Automática do Orçamento:** O total gasto nas notas fiscais do mês alimenta automaticamente o painel financeiro do Módulo 2, mostrando quanto do orçamento mensal de mercado/farmácia já foi consumido.
  3. **Histórico de Preços e Inflação Pessoal:** Comparativo de preços por produto entre mercados.

### Módulo 4: Segunda Mente (Anotações & Ponte Google Docs)
* **Visual Nativo Dark Mode (Sem cara de folha A4):**
  * Editor rápido de notas, ideias, documentos de princípios e cards de projetos ativos dentro do NEXUS.
* **Sincronização com Google Docs:**
  * O NEXUS se conecta via API gratuita do Google Docs a um documento seu (`NEXUS - Inbox & Anotações`).
  * Quando você pedir para o **Gemini normal do celular** anotar algo nesse Google Doc, o NEXUS lê o conteúdo do Doc e exibe formatado em cards escuros modernos dentro do seu painel, permitindo editar tanto pelo NEXUS quanto pelo Docs.

---

## 3. Como o App Normal do Gemini Conversa com o NEXUS (Custo R$ 0,00)

Em vez de pagar API ou usar WhatsApp, usamos o **ecossistema Google como ponte gratuita** para que você use o **aplicativo normal do Gemini** (e seus *Gems* personalizados):

1. **Do Gemini para o NEXUS (Entrada):**
   * **Agenda:** Você pede ao Gemini para agendar compromissos/hábitos no `@Google Calendar` → o NEXUS lê automaticamente.
   * **Notas:** Você pede ao Gemini para anotar ideias no seu Google Doc / `@Google Tasks` → o NEXUS lê via API do Google e organiza na sua Segunda Mente.
2. **Do NEXUS para o Gemini (Dois Modos para Não Poluir a Análise):**
   * **Modo 1 — Relatório Curto da Semana (Igual ao App de Rotina atual):** Continua existindo o botão de gerar e copiar apenas o texto pequenininho da semana da Rotina, para quando você quiser uma análise rápida e isolada da sua semana sem que o Gemini puxe o Google Drive inteiro e correlacione finanças sem necessidade.
   * **Modo 2 — Documento `NEXUS - Contexto Global da Vida (Auto-Sync)` no Google Drive:** Para análises 360º, o NEXUS mantém esse Google Doc sempre atualizado, porém **100% sintetizado**:
     * **Contexto Fixo:** Seus princípios, metas e perfil.
     * **Números-Chave Atuais (Sem extratos longos):** Apenas o **Total Aplicado na B3** (e totais por classe, sem listar cada ativo do extrato) + **Gasto do Mês Atual dividido por Segmento** (ex: Açougue, Hortifruti, Limpeza, Farmácia — sem listar produtos individuais).
     * **Histórico dos Últimos 12 Meses (Só Valores Cheios):** Apenas uma linha por mês fechado com o valor total aplicado, o valor cheio gasto nas notas fiscais do mês e a média da rotina.

---

## 4. Experiência de Uso: Tudo pelo App (Zero Dependência de WhatsApp)

* **Atalho Direto na Tela Inicial (PWA):**
  * Abrir o NEXUS pelo ícone na tela inicial do celular leva o mesmo tempo que abrir o WhatsApp, sem intermediários e sem risco de custo.
  * No celular, uma barra de ação rápida permite:
    1. Dar check-in nos hábitos do dia.
    2. Abrir a câmera e ler o QR Code de uma Nota Fiscal em 2 segundos.
    3. Digitar ou ditar uma nota rápida (usando o microfone do teclado/navegador).
    4. Ver quanto ainda pode gastar no mês e o status das metas/prêmios.
