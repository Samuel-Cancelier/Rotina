# 🏛️ Sistema de Gestão de Rotina, Metas e Score Ponderado

> **Painel Web (React + Vite) + Bot do Telegram + Firebase Firestore + Backend Híbrido (Python / Cloudflare)**

Sistema pessoal completo para organização diária de rotina, rastreamento de hábitos e cálculo automático de **Score Ponderado de Sucesso (0 a 100%)** baseado em **5 Pilares Soberanos**.

---

## 🌟 Como o Sistema Funciona (Em poucas palavras)

O sistema organiza sua vida em **3 níveis simples**:

1. **🏛️ Pilares Soberanos (Nível 1 - Onde você quer chegar):**
   - As grandes áreas da vida: *Atividade Física*, *Estudos e Leitura*, *Trabalho*, *Tarefas Domésticas* e *Diversos*.
   - Cada pilar possui uma **meta mensal de pontos** e um **peso** na sua nota final (Score Geral de 0 a 100).
2. **📁 Categorias Quantitativas (Nível 2 - Seus hábitos diários):**
   - Os hábitos que geram pontos para os pilares (ex: *Corrida*, *Musculação*, *Leitura de Livros*).
   - Você define a unidade de medida (km, treinos, páginas, horas) e o **fator de conversão** (ex: 1 km = 2 pontos; 1 treino = 10 pontos).
3. **📌 Atividades Segmentadas (Nível 3 - Os detalhes da execução):**
   - Lançamentos específicos dentro de uma categoria (ex: "Corrida no Parque", "Corrida na Esteira").

---

## 🚀 Como Iniciar o Sistema no seu Computador (Windows)

Você não precisa ser um expert em programação para rodar o app no dia a dia. Tudo foi automatizado para rodar com **1 clique**:

### Opção Recomendada: Criar Atalho na Área de Trabalho
1. Dê um duplo clique no arquivo **`criar_atalho_windows.bat`**.
2. Um atalho chamado **"Rotina e Metas"** será criado na sua Área de Trabalho (Desktop).
3. Pronto! Toda vez que quiser usar o app, basta clicar duas vezes nesse atalho.

### Opção Manual: Iniciar pelo Terminal / Pasta
1. Dê um duplo clique no arquivo **`iniciar_app.bat`**.
2. O script fará tudo sozinho:
   - Ativa o ambiente Python (`venv`).
   - Inicia o servidor Python com a API e o Bot do Telegram em segundo plano.
   - Inicia o painel Web e abre o seu navegador automaticamente em `http://localhost:3000`.

---

## 🤖 Comandos do Bot no Telegram

Você pode registrar suas atividades do dia a dia diretamente pelo celular no Telegram:

| Comando | O que ele faz | Exemplo Prático |
| :--- | :--- | :--- |
| `/feito [categoria] [atividade] [qtd]` | Registra o que você realizou e gera pontos imediatos para o Pilar | `/feito corrida Parque 5` *(Lança 5 km e gera 10 pts)* |
| `/score` | Mostra seu Score Geral do mês e o progresso em cada pilar | `/score` |
| `/pilares` | Lista os 5 Pilares, suas metas de pontos e seus pesos | `/pilares` |
| `/categorias` | Lista suas categorias e regras de pontuação | `/categorias` |
| `/atividades` | Lista suas atividades cadastradas | `/atividades` |
| `/nova_atividade` | Inicia um assistente com botões na tela para cadastrar nova atividade | `/nova_atividade` |
| `/agenda` | Exibe seus compromissos e rotinas agendadas para hoje | `/agenda` |
| `/agendar [texto]` | Cria um agendamento rápido no seu calendário | `/agendar Reunião 14h` |
| `/rotina` | Abre menu interativo para agendar uma rotina cadastrada | `/rotina` |

---

## 🖥️ As 8 Abas do Painel Web

O painel no navegador (`http://localhost:3000`) possui 8 áreas dedicadas:

1. **🛡️ Pilares:** Visão macro do mês, velocímetro do Score Geral, progresso de cada pilar e ajuste rápido de metas e pesos.
2. **📁 Categorias:** Criação de novos hábitos, ajuste de conversão de pontos e acompanhamento de metas puras.
3. **📌 Atividades:** Cadastro detalhado de hábitos vinculados às categorias.
4. **📅 Calendário:** Planejamento mensal, marcação de tarefas concluídas e agendamentos pontuais ou recorrentes.
5. **📋 Lançamentos (Histórico):** Lista de tudo o que foi lançado (via Bot ou Web), botão de lançamento rápido, edição e exclusão (com estorno automático de pontos).
6. **🤖 Telegram Bot (Simulador):** Permite simular conversas com o bot diretamente na tela do computador.
7. **📊 Analytics:** Gráficos com evolução semanal, mensal e balanço consolidado anual.
8. **🗄️ Banco (Schema):** Visualizador didático da estrutura de dados salva no Firebase Firestore.

---

## 📁 Estrutura de Arquivos do Projeto

```text
meus-apps/Rotina/
├── iniciar_app.bat            # Script de 1 clique para iniciar o sistema no Windows
├── criar_atalho_windows.bat   # Cria o atalho do app na sua Área de Trabalho
├── main.py                    # Servidor Python unificado (API Flask + Bot Telegram)
├── bot.py                     # Lógica dos comandos do Bot Telegram (Python)
├── endpoints.py               # Rotas da API REST do backend Python (/api/*)
├── database.py                # Conexão e operações no Firebase Firestore (Python)
├── chave-firebase.json        # Chave de credencial da conta de serviço do Firebase
├── requirements.txt           # Bibliotecas necessárias para o Python
├── Dockerfile                 # Configuração para empacotar o backend em contêiner
├── docker-compose.yml         # Execução com Docker local ou VPS
├── frontend/                  # Código-fonte da interface visual (React + Vite)
│   ├── src/
│   │   ├── App.tsx            # Componente central da aplicação
│   │   ├── components/        # Telas e abas do painel (Pilares, Calendário, etc.)
│   │   ├── data/              # Dados iniciais e cores dos pilares
│   │   └── types.ts           # Definições de tipos TypeScript
│   └── package.json           # Dependências do frontend (Node.js)
├── cloudflare-worker/         # Versão alternativa para rodar 100% na Nuvem Serverless
│   ├── wrangler.toml          # Configurações do Worker da Cloudflare
│   └── src/                   # Código TypeScript com cliente REST Firestore nativo
└── docs/                      # Documentação detalhada
    ├── DOCUMENTATION.md       # Manual completo de regras de negócio e uso
    └── CLOUD_GUIA.md          # Guia de publicação na Cloudflare (Workers & Pages)
```

---

## 📚 Guias Complementares

- Para entender a matemática de cálculo de pontos e guia detalhado das telas:  
  👉 Leia o **[Manual Completo do Sistema (docs/DOCUMENTATION.md)](file:///c:/Users/samue/Documents/meus%20Apps/Rotina/docs/DOCUMENTATION.md)**.
- Para rodar na nuvem gratuita da Cloudflare (zero servidores):  
  👉 Leia o **[Guia Cloudflare Workers & Pages (docs/CLOUD_GUIA.md)](file:///c:/Users/samue/Documents/meus%20Apps/Rotina/docs/CLOUD_GUIA.md)**.
- Para rodar em Docker, Cloud Run, Render ou Railway:  
  👉 Leia o **[Guia de Deploy em Nuvem (DEPLOY_NUVEM.md)](file:///c:/Users/samue/Documents/meus%20Apps/Rotina/DEPLOY_NUVEM.md)**.
