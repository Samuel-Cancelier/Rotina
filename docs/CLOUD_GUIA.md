# 🌐 Guia de Integração e Deploy no Cloudflare (Workers & Pages)

Este documento contém a **análise técnica completa de viabilidade, limitações, bibliotecas não suportadas** e o **passo a passo para publicar o sistema no Cloudflare**.

---

## 1. Análise Técnica de Limitações e Viabilidade

### 1.1 O que é o Cloudflare Workers?
O **Cloudflare Workers** é um ambiente *serverless* baseado em isolados V8 (JavaScript / TypeScript / WebAssembly) distribuído em mais de 300 data centers globais.
Diferente de um servidor tradicional (como uma VPS ou container Docker no Cloud Run), o Worker:
- **Não possui disco persistente**.
- **Não roda processos em background contínuo** (loops infinitos ou threads que escutam conexões).
- **É orientado puramente a eventos** (executa em microssegundos ao receber uma requisição HTTP e encerra).

---

### 1.2 Incompatibilidades do Backend Python Atual com Workers

| Componente Python Atual | Compatibilidade Cloudflare Workers | Motivo Técnico / Limitação |
| :--- | :---: | :--- |
| **`firebase-admin`** / **`google-cloud-firestore`** | ❌ **Incompatível** | Dependem de binários nativos em C (`grpcio`, `cffi`, sockets POSIX). O suporte a Python do Cloudflare (Pyodide em WebAssembly) **não compila nem roda gRPC nativo**. |
| **`telebot.infinity_polling()`** | ❌ **Incompatível** | Polling contínuo requer uma thread/processo rodando para sempre. No Cloudflare Workers, a execução morre após a resposta da requisição (timeout rígido de CPU). |
| **`flask` com `app.run()`** | ❌ **Incompatível** | Flask requer um servidor WSGI escutando em porta TCP (`0.0.0.0:8080`), o que não existe no isolado V8. |

---

### 1.3 A Solução de Alta Performance: Arquitetura Nativa Cloudflare

Para viabilizar o sistema no Cloudflare mantendo **100% dos seus dados existentes no Firebase Firestore**, criamos uma pasta dedicada chamada `cloudflare-worker/`:

1. **Telegram via Webhook (`POST /webhook`)**:
   - O Telegram envia a mensagem para a URL do seu Worker na borda da Cloudflare.
   - O Worker responde instantaneamente (< 50ms) usando a API oficial do Telegram (`fetch`).
2. **Conector Firestore Nativo REST API com Web Crypto**:
   - Sem bibliotecas C++ pesadas.
   - O Worker assina tokens JWT usando a **Web Crypto API nativa do V8 (`crypto.subtle`)** e consulta o Firestore pela **REST API oficial do Google**.
   - Seus pilares, categorias, atividades e histórico continuam no mesmo projeto Firebase (`rotina-94433`).
3. **API REST (`/api/*`)**:
   - Rotas de Pilares, Categorias, Atividades e Agendamentos prontas com suporte a CORS.
4. **Frontend no Cloudflare Pages**:
   - O React/Vite é compilado em arquivos estáticos (`dist/`) e servido com CDN global gratuito, suporte a HTTPS automático e cache.

---

## 2. Estrutura dos Arquivos Criados no Projeto

```
rotina-metas/
├── cloudflare-worker/             <-- Backend Serverless para o Cloudflare
│   ├── wrangler.toml              <-- Configurações do Cloudflare Worker
│   ├── package.json               <-- Scripts de build e deploy
│   ├── tsconfig.json              <-- Configuração TypeScript
│   └── src/
│       ├── index.ts               <-- API REST (/api/*) e Webhook (/webhook)
│       ├── firestore.ts           <-- Cliente REST Firestore (Web Crypto RS256)
│       └── telegram.ts            <-- Processador de Comandos do Bot
├── frontend/                      <-- Painel React SPA (Vai para o Cloudflare Pages)
└── docs/CLOUD_GUIA.md             <-- Este guia
```

---

## 3. Passo a Passo de Instalação e Deploy

### Pré-requisitos
- Uma conta gratuita na [Cloudflare](https://dash.cloudflare.com/).
- Node.js instalado (versão 18 ou superior).

---

### Passo 1: Instalar e Autenticar a CLI da Cloudflare (Wrangler)
No seu terminal local:
```bash
npm install -g wrangler
wrangler login
```
*Isso abrirá o navegador para você autorizar o login na sua conta Cloudflare.*

---

### Passo 2: Configurar o Backend no Cloudflare Workers

1. Acesse a pasta do worker:
```bash
cd cloudflare-worker
npm install
```

2. Configure a Chave Privada do Firebase e a Senha da API como Segredos:
O arquivo `wrangler.toml` já possui o Project ID e o Client Email. Você precisará armazenar a chave privada RSA do Firebase e uma senha secreta para proteger o seu painel web e API:
```bash
# Adicione a chave privada do Firebase
npx wrangler secret put FIREBASE_PRIVATE_KEY

# Crie uma senha secreta para proteger o acesso à API e ao Painel Web
npx wrangler secret put API_SECRET_KEY
```
*Quando solicitado para `FIREBASE_PRIVATE_KEY` no terminal, cole a chave privada inteira do arquivo `chave-firebase.json` (incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`).*
*Quando solicitado para `API_SECRET_KEY`, digite a senha da sua escolha. Ela será exigida na interface Web para que você possa acessar seus dados.*

3. Fazer o Deploy do Worker:
```bash
npx wrangler deploy
```
*Ao concluir, o terminal exibirá a URL pública do seu Worker, por exemplo:*
`https://rotina-metas-api.<seu-subdominio>.workers.dev`

---

### Passo 3: Ativar o Webhook do Telegram
Com o Worker publicado, ative o recebimento de mensagens do Telegram com um simples clique:
Acesse no seu navegador:
```
https://rotina-metas-api.<seu-subdominio>.workers.dev/set_webhook
```
O retorno será:
```json
{
  "webhook_configurado": "https://rotina-metas-api.<seu-subdominio>.workers.dev/webhook",
  "telegram_response": {
    "ok": true,
    "result": true,
    "description": "Webhook was set"
  }
}
```
🎉 **Pronto! Seu Bot do Telegram já está respondendo no Telegram a partir da rede global da Cloudflare!**

---

### Passo 4: Publicar o Frontend no Cloudflare Pages

Você pode publicar o frontend React no Cloudflare Pages de duas formas:

#### Opção A: Pelo Dashboard da Cloudflare (Recomendado via GitHub)
1. No [Painel da Cloudflare](https://dash.cloudflare.com/), vá em **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Selecione o repositório do projeto.
3. Configure o Build:
   - **Framework Preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Em **Environment variables (Variáveis de ambiente)**, adicione:
   - `VITE_API_URL`: `https://rotina-metas-api.<seu-subdominio>.workers.dev`
5. Clique em **Save and Deploy**.

#### Opção B: Deploy direto via CLI (Wrangler)
No terminal da sua máquina:
```bash
# 1. Compila o frontend apontando para o seu Worker da Cloudflare
cd frontend
export VITE_API_URL="https://rotina-metas-api.<seu-subdominio>.workers.dev"
npm run build

# 2. Publica no Cloudflare Pages
npx wrangler pages deploy dist --project-name rotina-metas-web
```

---

## 4. Comparativo de Arquiteturas: Cloudflare vs Cloud Run

| Critério | Cloudflare (Workers + Pages) | Google Cloud Run (Docker Python) |
| :--- | :--- | :--- |
| **Custo** | 100% Gratuito (100k req/dia no plano Free) | Gratuito na cota mensal de CPU/RAM |
| **Tempo de Inicialização (Cold Start)** | **0 ms** (instantâneo na borda) | 2 a 5 segundos caso a instância congele |
| **Linguagem do Backend** | TypeScript / JavaScript (V8) | Python 3.10 nativo |
| **Bot do Telegram** | Webhook nativo com sub-50ms de resposta | Webhook ou Polling contínuo |
| **Manutenção** | Zero servidores, zero containers | Manutenção de imagem Docker |

Ambas as soluções foram deixadas 100% prontas no projeto:
- Para rodar na **Cloudflare**: use o diretório `cloudflare-worker/` e Cloudflare Pages.
- Para rodar no **Google Cloud Run**: use o `main.py` e `Dockerfile` existentes.
