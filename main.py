"""
Servidor Unificado: Webhook/API Flask + Bot do Telegram (main.py)
Recebe requisições do painel web React e processa comandos do Telegram.

Vantagens:
- Roda localmente com um único comando (inicia a API e o Bot em segundo plano).
- Compatível com deploy no Google Cloud Run (Webhook).
- Conecta o Frontend (localhost:3000) com o Firestore via endpoints /api/*.
"""

import os
import threading
from flask import Flask, request, jsonify
import telebot
from bot import bot
from endpoints import register_endpoints

app = Flask(__name__)
register_endpoints(app)

# Rota de verificação de integridade (Healthcheck do Cloud Run)
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "servico": "Telegram Bot Rotina & Metas (API & Webhook)",
        "plataforma": "Google Cloud Run / Local"
    }), 200

# Endpoint onde o Telegram entrega as mensagens (quando em modo Webhook no Cloud Run)
@app.route("/webhook", methods=["POST"])
def telegram_webhook():
    if request.headers.get("content-type") == "application/json":
        json_string = request.get_data().decode("utf-8")
        update = telebot.types.Update.de_json(json_string)
        if update:
            bot.process_new_updates([update])
        return "OK", 200
    else:
        return "Unsupported Media Type", 415

# Endpoint utilitário para registrar ou verificar o Webhook no Telegram
@app.route("/set_webhook", methods=["GET"])
def configurar_webhook():
    url_publica = request.args.get("url")
    if not url_publica:
        host = request.headers.get("Host")
        scheme = request.headers.get("X-Forwarded-Proto", "https")
        url_publica = f"{scheme}://{host}"

    webhook_url = f"{url_publica.rstrip('/')}/webhook"
    try:
        bot.remove_webhook()
        sucesso = bot.set_webhook(url=webhook_url)
        return jsonify({
            "sucesso": sucesso,
            "webhook_configurado": webhook_url
        }), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

def rodar_polling_local():
    """Inicia polling do Telegram em background para escutar mensagens em modo local."""
    try:
        bot.remove_webhook()
        print("🤖 [Telegram] Bot escutando comandos em tempo real (Polling)...")
        bot.infinity_polling(timeout=20, long_polling_timeout=15)
    except Exception as e:
        print(f"⚠️ [Telegram] Aviso no polling: {e}")

if __name__ == "__main__":
    # Em execução local, inicia o Bot em segundo plano para você não precisar de dois terminais
    if os.environ.get("ENABLE_POLLING", "true").lower() == "true":
        t = threading.Thread(target=rodar_polling_local, daemon=True)
        t.start()

    porta = int(os.environ.get("PORT", 8080))
    print(f"🌐 [API] Servidor Flask iniciado na porta {porta} (Conectado ao Firestore)...")
    app.run(host="0.0.0.0", port=porta)
