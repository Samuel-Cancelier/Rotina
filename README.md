# App de Rotina, Check-in & Metas

> **"O Google planeja, o app cobra e mede, o Gemini analisa."**

Sistema pessoal de acompanhamento de hábitos e metas integrado ao ecossistema Google (Google Tasks, Google Agenda e Gemini).

---

## Como Funciona o Ciclo

1. **Google Tasks / Planejamento:** Você lista as demandas e rotinas no Google Tasks.
2. **Gemini (Habilidade do Planejador de Rotina):** O Gemini lê suas tarefas e agenda os hábitos no calendário **"Rotina"** do seu Google Agenda usando o padrão `[Tag] descrição — quantidade` (ex: `[Corrida] Rodagem leve — 5 km`, `[Treino] Peito e ombro anterior — 60 min`, `[Leitura] Sapiens — 30 páginas`).
3. **App Rotina (Check-in Diário):** O app lê o seu Google Agenda e pergunta sobre os hábitos de ontem e de hoje: *"Fez? Quantos km/páginas? Se não fez, qual foi o motivo?"*. Permite também lançar atividades extras fora da agenda.
4. **Relatório Semanal:** O app compila sua aderência, metas cumpridas, notas, falhas e padrões num texto formatado em Markdown.
5. **Análise com o Gemini:** Você copia o relatório com 1 clique e cola no Gemini todo domingo para ele diagnosticar gargalos e propor a agenda da próxima semana.

---

## 4 Abas Simplificadas

- **Hoje (Check-in):** Cartões rápidos dos hábitos agendados para responder em menos de 1 minuto (`Fiz`, `Parcial`, `Não fiz` com motivos, `Remarcar`).
- **Semana & Metas:** Acompanhamento visual da sua aderência e metas de frequência e volume divididas pelos 5 Pilares.
- **Relatório & Gemini:**
  - **Relatório Semanal:** Gera o texto completo em Markdown pronto para colar no Gemini.
  - **Habilidade do Google (Custom Gem):** Prompt completo pronto para você criar o seu Gem no Gemini que cria eventos no padrão correto do Google Agenda.
- **Configurações:**
  - Conexão com Google Agenda (Client ID).
  - Categorias, tags reconhecidas, unidades e metas semanais.
  - Pilares de vida e pesos no Score Geral.
  - Objetivos de médio/longo prazo ("Prêmios").
  - Documento de contexto pessoal.
  - Sincronização em nuvem (Cloudflare Worker & Firestore).

---

## Execução Local

Dê um duplo clique em `iniciar_app.bat` ou execute:

```bash
cd frontend
npm run dev
```

Abra no navegador em `http://localhost:3000`.
