# 🚀 Guia Completo de Deploy em Nuvem

Este guia explica como hospedar o seu **Sistema de Gestão de Rotina e Metas** na nuvem para que ele funcione 24 horas por dia, 7 dias por semana, sem depender do seu computador estar ligado.

---

## 🏗️ Como a Aplicação Funciona na Nuvem

O sistema opera com 3 camadas integradas:

```text
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│     1. PAINEL WEB / FRONTEND         │       │     2. BACKEND & BOT DO TELEGRAM     │
│  (Cloudflare Pages, Vercel, Netlify) │       │ (Cloud Run, Render, Railway ou VPS)  │
└──────────────────┬───────────────────┘       └──────────────────┬───────────────────┘
                   │                                              │
                   │           Requisições API (/api/*)           │
                   └──────────────────────►◄──────────────────────┘
                                           │
                                           ▼
                      ┌────────────────────────────────────────┐
                      │ 3. BANCO DE DADOS (Firebase Firestore) │
                      │  Pilares, Categorias, Atividades,      │
                      │  Registros Mensais e Agendamentos      │
                      └────────────────────────────────────────┘
```

---

## 🌐 Opção A: Cloudflare Workers & Pages (100% Gratuita e Sem Servidores)

Se você procura **zero manutenção** e **custo zero** absoluto:
- O backend e o bot rodam na borda global do **Cloudflare Workers**.
- O frontend roda no **Cloudflare Pages**.
- 👉 Siga o passo a passo completo no arquivo **[docs/CLOUD_GUIA.md](file:///c:/Users/samue/Documents/meus%20Apps/Rotina/docs/CLOUD_GUIA.md)**.

---

## ☁️ Opção B: Google Cloud Run (Container Docker Oficial)

O **Google Cloud Run** executa o contêiner Docker do `main.py` (que reúne a API Flask e o webhook do Telegram) e escala para zero quando inativo, ficando dentro da cota gratuita mensal da Google Cloud.

### Passo a Passo no Cloud Run:
1. **Instale a Google Cloud CLI (`gcloud`)** e faça login:
   ```bash
   gcloud auth login
   gcloud config set project rotina-94433
   ```
2. **Faça o Deploy com um comando:**
   ```bash
   gcloud run deploy rotina-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars TELEGRAM_BOT_TOKEN="SEU_TOKEN_AQUI",ENABLE_POLLING="false"
   ```
3. **Configure o Webhook do Telegram:**
   Ao final do deploy, você receberá a URL do serviço (ex: `https://rotina-backend-xyz-uc.a.run.app`). Execute:
   ```bash
   python configurar_webhook_cloudrun.py https://rotina-backend-xyz-uc.a.run.app
   ```
4. **Pronto!** O Telegram entregará as mensagens instantaneamente via `POST /webhook`.

---

## 🟢 Opção C: Render.com (Background Worker ou Web Service)

O **Render** conecta direto ao seu repositório no GitHub:

1. Suba seu projeto para um repositório no **GitHub**.
2. Acesse [render.com](https://render.com) e crie uma conta gratuita.
3. No painel, clique em **New +** ➔ **Web Service** (se quiser API + Bot) ou **Background Worker** (apenas Bot).
4. Preencha as configurações:
   * **Name:** `rotina-sistema`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `python main.py` (para Web Service) ou `python bot.py` (para Worker)
5. Em **Environment Variables**, adicione:
   * `TELEGRAM_BOT_TOKEN`: O token do seu Bot do Telegram.
   * `FIREBASE_CREDENTIALS_PATH`: `chave-firebase.json`
6. Em **Secret Files**, crie um arquivo chamado `chave-firebase.json` e cole o conteúdo do seu arquivo de credenciais do Firebase.
7. Clique em **Create Web Service**.

---

## 🚂 Opção D: Railway.app

1. Acesse [railway.app](https://railway.app) e crie um novo projeto a partir do seu repositório GitHub.
2. O Railway detectará o `Dockerfile` automaticamente.
3. Na aba **Variables**, adicione seu `TELEGRAM_BOT_TOKEN`.
4. Faça o upload ou adicione o conteúdo da `chave-firebase.json`.
5. O Railway gerará o build e iniciará o serviço com suporte a domínio público automático.

---

## 🐳 Opção E: Servidor VPS Próprio com Docker Compose

Se você possui uma VPS (Linux Ubuntu/Debian na DigitalOcean, Hetzner, AWS, Oracle Cloud, etc.):

1. Instale o Docker e o Docker Compose:
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose -y
   ```
2. Transfira os arquivos do projeto para a VPS.
3. Certifique-se de que a `chave-firebase.json` está na mesma pasta.
4. Crie um arquivo `.env` contendo:
   ```bash
   TELEGRAM_BOT_TOKEN=seu_token_do_telegram
   ```
5. Inicie o sistema em segundo plano:
   ```bash
   docker-compose up -d --build
   ```
6. Para acompanhar os logs de mensagens recebidas:
   ```bash
   docker-compose logs -f
   ```

---

## 📱 Publicando o Painel Web (Frontend)

Para publicar o painel visual na internet:

1. **Defina a URL da sua API:**
   Abra `frontend/.env` e aponte para o backend que você subiu:
   ```env
   VITE_API_URL=https://rotina-backend-xyz.a.run.app
   ```
2. **Gere os arquivos estáticos de produção:**
   ```bash
   cd frontend
   npm run build
   ```
3. A pasta `frontend/dist` gerada pode ser publicada gratuitamente na **Vercel**, **Netlify**, **Cloudflare Pages** ou **Firebase Hosting**.

---

## ✅ Teste de Validação
Após subir o serviço na nuvem, envie no seu Telegram:
```text
/start
/feito corrida Parque 5
/score
```
Se o bot responder com a confirmação e os pontos gerados, seu sistema está 100% ativo e autônomo na nuvem!

