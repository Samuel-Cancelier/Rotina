# Documentação Oficial: Sistema de Gestão de Rotina e Metas (v2.0)

> **Versão:** 2.0 (Nuvem, Google Identity & Gemini)  
> **Status:** Em Produção  
> **URL da Aplicação Web:** [rotina-metas-web.pages.dev](https://rotina-metas-web.pages.dev)  
> **API Serverless:** [rotina-metas-api.rotinas.workers.dev](https://rotina-metas-api.rotinas.workers.dev)  
> **Repositório:** [github.com/Samuel-Cancelier/Rotina](https://github.com/Samuel-Cancelier/Rotina)

---

## 1. Visão Geral e Filosofia do Sistema

O sistema foi arquitetado com base no princípio da **Tríade Operacional**: cada ferramenta faz aquilo em que é excelente, eliminando atrito, redundância e complexidade desnecessária.

```
       ┌───────────────────────────────┐
       │         GOOGLE AGENDA         │
       │   "O Planejamento Temporal"   │
       │  (Onde o tempo é reservado)   │
       └──────────────┬────────────────┘
                      │ Lê eventos via GIS
                      ▼
       ┌───────────────────────────────┐
       │         APP DE ROTINA         │
       │     "A Cobrança e a Métrica"  │
       │ (Check-in rápido, aderência)  │
       └──────────────┬────────────────┘
                      │ Exporta Relatório Markdown
                      ▼
       ┌───────────────────────────────┐
       │       GEMINI ASSISTENTE       │
       │   "A Inteligência e o Mentor" │
       │  (Análise, feedbacks, ajustes)│
       └───────────────────────────────┘
```

1. **O Google Agenda planeja:** Você ou seu assistente Gemini marcam seus blocos de treino, estudos, leituras e compromissos na agenda.
2. **O App cobra e mede:** O app puxa automaticamente a sua agenda, identifica o que é hábito e o que é compromisso geral, e exige apenas um toque de confirmação no seu dia. Ele calcula aderência, pontos e metas mínimas da semana.
3. **O Gemini analisa:** Você copia o relatório semanal/mensal formatado em Markdown com um clique e entrega ao seu Gem no Gemini, que atua como um mentor de alta altitude ajustando sua estratégia.

---

## 2. Arquitetura Técnica

```
[ Usuário / Celular / PC ]
         │
         ▼  (HTTPS / PWA)
[ Cloudflare Pages: rotina-metas-web.pages.dev ]
   ├─ React 19 + TypeScript + Vite + Tailwind CSS
   ├─ Google Identity Services (GIS - OAuth2 Token Client)
   └─ Bloqueio Local por PIN (Criptografia SHA-256 + Salt)
         │
         ▼  (x-api-key autenticada)
[ Cloudflare Worker: rotina-metas-api.rotinas.workers.dev ]
   ├─ Roteador REST CRUD Universal (/api/:collection)
   ├─ Tokens de Serviço Google JWT gerados na Edge
   └─ Google Cloud Firestore REST API (Porto Alegre - southamerica-east1)
```

### 2.1 Frontend (Web / PWA)
* **Framework:** React com TypeScript, empacotado por Vite.
* **Estilo:** Tailwind CSS (Dark Mode nativo `#0a0a0a` com contraste visual planejado para uso rápido no celular).
* **Segurança de Acesso:** Tela de bloqueio por PIN de 4 a 6 dígitos (`AuthLockScreen`). O PIN nunca é salvo em texto puro: utiliza hash SHA-256 criptográfico com salt salvo localmente.
* **PWA:** Totalmente instalável no smartphone Android/iOS via menu "Adicionar à tela de início", com ícones próprios, splash e viewport configurados.

### 2.2 Backend Serverless (Cloudflare Worker v2)
* Código em TypeScript compilado e executado na rede global da Cloudflare.
* Roteamento REST:
  * `GET /api/:collection` - Lista todos os documentos.
  * `POST /api/:collection` - Cria ou substitui documento.
  * `PUT /api/:collection/:id` - Atualiza campos de um documento.
  * `DELETE /api/:collection/:id` - Remove documento.
* **Segurança da API:** Todas as requisições exigem o header `x-api-key`.
* **Comunicação com o Firestore:** Utiliza autenticação Service Account com geração de JWT assinado via Web Crypto API na própria Edge da Cloudflare, comunicando-se diretamente com a API REST do Firestore sem intermediários lentos.

### 2.3 Banco de Dados (Cloud Firestore)
O banco de dados utiliza as seguintes coleções seguras:
* `rotina_pilares`: Configuração das áreas da vida (Saúde, Intelectual, etc.), pesos e metas mensais.
* `rotina_categorias`: Hábitos específicos (Musculação, Corrida, Leitura, etc.), suas metas mínimas, cores e tags de identificação.
* `rotina_registros`: Histórico diário de check-in (`feito`, `parcial`, `nao_feito`, `remarcado`, `ignorado`).
* `rotina_objetivos`: Prêmios e metas de longo prazo com valores alvo.
* `rotina_config`: Documento de contexto do usuário e preferências gerais.

---

## 3. Integração com o Google Agenda

### 3.1 Permissões e Segurança
* **Escopo utilizado:** `https://www.googleapis.com/auth/calendar.readonly`.
* **Privacidade total:** O app tem acesso **estritamente de leitura**. Ele nunca apaga, altera ou cria eventos na sua conta Google sem o seu consentimento.
* **Tokens Voláteis:** O token de acesso obtido via Google Identity Services (GIS) é mantido apenas na memória da sessão web.

### 3.2 Como o App Identifica os Hábitos
O motor de processamento (`agenda.ts`) varre todas as agendas da sua conta Google e aplica o algoritmo de busca:
1. **Tag Explicita no Título ou Descrição:** Procura por colchetes, por exemplo:
   * `[Musculação] Treino A (Peito e Tríceps)` ➔ Categoria **Musculação**
   * `[Corrida] 5km na orla` ➔ Categoria **Corrida**
   * `[Leitura] Capítulo 4` ➔ Categoria **Leitura**
2. **Palavras-chave Inteligentes (Fallback):** Se o evento não tiver colchetes, o app procura termos no título:
   * "treino", "academia", "musculação", "leg day" ➔ Musculação
   * "corrida", "correr", "trote" ➔ Corrida
   * "leitura", "livro", "ler" ➔ Leitura
   * "estudo", "estudar", "curso" ➔ Estudo Focado
   * "feit", "planejamento", "revisão" ➔ FEIT

### 3.3 Separação Inteligente no Check-in
Para evitar que compromissos aleatórios poluam sua rotina:
* **Seção 1: Hábitos & Rotinas:** Apenas eventos que tiveram tags ou palavras-chave reconhecidas.
* **Seção 2: Outros Eventos & Lembretes da Agenda:** Feriados, jogos, reuniões de trabalho, médicos, etc.
  * Você pode clicar em **"Ignorar"** para sumir da tela.
  * Se for um hábito que você esqueceu de taguear na agenda, ao clicar em "Fiz", o app abre um seletor na hora para você escolher a qual categoria ele pertence!

---

## 4. As 4 Visões do Aplicativo

### 4.1 Aba "Check-in" (O Centro de Comando Diário)
* Mostra os eventos do dia organizados em cards objetivos.
* **Botões de Ação:**
  * **Feito:** Registra cumprimento integral e soma pontos/quantidades à sua meta.
  * **Parcial:** Para dias em que você fez algo menor (ex: 20 min em vez de 45 min).
  * **Não Feito:** Registra falha e impacta negativamente a taxa de aderência.
  * **Remarcar:** Adiamento consciente. **Não penaliza a taxa de aderência e não abaixa o score.**
  * **Ignorar:** Remove eventos não relacionados a rotinas (disponível na seção de outros eventos).

### 4.2 Aba "Semana" (Aderência e Ritmo)
* **Grid Temporal Superior:** Visualização dos 7 dias da semana com indicadores visuais de sucesso, pendências ou falhas.
* **Metas Mínimas Realistas:** Barras de progresso por hábito:
  * Musculação: 3 treinos de 45 min por semana.
  * Corrida: 2 treinos / 7 km semanais no total.
  * Leitura: 3 sessões / 60 páginas por semana.
  * Estudo Focado: 2 blocos / 3 horas semanais.
  * FEIT: 1 sessão / 2 horas semanais.

### 4.3 Aba "Relatórios" (A Ponte com a IA)
* Gera com um clique os relatórios formatados em Markdown:
  * **Relatório Semanal:** Resumo dos últimos 7 dias, aderência percentual, hábitos cumpridos, remarcados e falhas.
  * **Relatório Mensal Consolidado:** Balanço de todas as semanas do mês, evolução das metas acumuladas e prontidão para prêmios.
* Inclui um botão para visualizar o **Prompt do Sistema (Gem)** a ser colado no Gemini.

### 4.4 Aba "Configurações"
* Conexão e desconexão com o Google Agenda.
* Gerenciamento de Pilares e Categorias (ajuste de metas mínimas, pesos e cores).
* Edição dos **Objetivos de Longo Prazo / Prêmios** (viagens, aquisições, conquistas).
* **Documento de Contexto de Vida:** Texto livre onde você descreve seu momento profissional, rotina de trabalho, limitações físicas e prioridades atuais para que o Gemini leve em conta nas análises.
* Sincronização manual com a nuvem Cloudflare.

---

## 5. Como Operar com o Gemini (Seu Assistente Pessoal)

### 5.1 Na criação dos eventos na agenda
Ao conversar com seu assistente Gemini pelo celular ou computador, basta pedir:
> *"Gemini, agende musculação amanhã às 18:30 e coloque a tag [Musculação]."*  
> *"Gemini, remarca meu treino de hoje para quinta-feira às 19:00."*

### 5.2 No fechamento da semana ou do mês
1. Abra a aba **Relatórios** no app.
2. Clique em **"Copiar Relatório da Semana"**.
3. Abra a conversa com o seu Gem no Gemini e cole o relatório.
4. O Gemini analisará sua performance, apontará se houve excesso de adiamentos (remarcações), calculará seu score e sugerirá os ajustes necessários para a semana seguinte.
