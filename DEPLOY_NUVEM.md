# 🚀 Guia Completo: Como Rodar o Sistema 100% na Nuvem

Este projeto é composto por **3 partes que trabalham juntas na nuvem**:

```
 ┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
 │     1. APP WEB / DASHBOARD PWA       │       │       2. BOT DO TELEGRAM (Python)    │
 │ (Roda no Google Cloud Run / Vercel)  │       │   (Roda no Render / Railway / VPS)   │
 └──────────────────┬───────────────────┘       └──────────────────┬───────────────────┘
                    │                                              │
                    ▼                                              ▼
       ┌────────────────────────────────────────────────────────────────┐
       │             3. BANCO DE DADOS EM NUVEM (Firestore)             │
       │   Guarda Pilares Soberanos, Categorias, Atividades e Feitos    │
       └────────────────────────────────────────────────────────────────┘
```

---

## 🟢 Opção 1: Render.com (Mais Fácil e 100% Gratuita)

O **Render** permite rodar o bot Python 24/7 como um **Background Worker** gratuito, conectado direto ao seu GitHub.

### Passo a passo:
1. Suba o código deste projeto para o seu **GitHub** (repositório público ou privado).
2. Acesse [render.com](https://render.com) e crie uma conta gratuita.
3. No painel, clique em **New +** ➔ **Background Worker**.
4. Conecte o repositório do seu GitHub.
5. Preencha as configurações:
   * **Name:** `rotina-telegram-bot`
   * **Region:** Ohio (ou a mais próxima)
   * **Branch:** `main`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `python bot.py`
6. Clique em **Advanced** ➔ **Add Environment Variable**:
   * `TELEGRAM_BOT_TOKEN`: o token do seu bot (ex: `8949673934:AAEjhmDizSs0hbhhDVXDnNXf8fLr1PA1KlQ`)
   * Se for usar chave do Firebase como variável: crie uma Secret File chamada `chave-firebase.json` e cole o conteúdo do seu JSON.
7. Clique em **Create Background Worker**.
8. Pronto! Em 1 minuto o bot estará online e respondendo 24 horas por dia, mesmo com seu computador desligado.

---

## 🚂 Opção 2: Railway.app

O **Railway** detecta o `Procfile` ou `Dockerfile` automaticamente:

1. Acesse [railway.app](https://railway.app).
2. Clique em **New Project** ➔ **Deploy from GitHub repo**.
3. Selecione o seu repositório.
4. Vá em **Variables** e adicione:
   * `TELEGRAM_BOT_TOKEN`: seu token do Telegram.
5. O Railway fará o build do container Docker automaticamente e iniciará o bot.

---

## 🐳 Opção 3: Qualquer Servidor VPS com Docker (Oracle Cloud Free Tier, DigitalOcean, AWS)

Se você tem uma máquina virtual / VPS:

1. Instale o Docker na máquina:
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose -y
   ```
2. Clone o repositório ou envie os arquivos para a VPS.
3. Certifique-se de que o arquivo `chave-firebase.json` está na mesma pasta.
4. Inicie o container em segundo plano:
   ```bash
   docker-compose up -d
   ```
5. Para verificar os logs do bot rodando:
   ```bash
   docker-compose logs -f
   ```

---

## 📱 Testando no Telegram

Assim que o serviço estiver no ar na nuvem, abra o seu bot no Telegram e envie:
```text
/start
/feito corrida Parque 5
/score
```
Ele responderá instantaneamente confirmando a gravação no Firestore e o recálculo dos pontos do seu Pilar Soberano!
