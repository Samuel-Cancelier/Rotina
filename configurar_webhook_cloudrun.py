"""
Script Utilitário: Registrar Webhook no Telegram (configurar_webhook_cloudrun.py)
Uso:
  python configurar_webhook_cloudrun.py https://seu-app-cloudrun.a.run.app
"""

import sys
import os
import telebot
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8949673934:AAEjhmDizSs0hbhhDVXDnNXf8fLr1PA1KlQ")
bot = telebot.TeleBot(TOKEN)

def main():
    if len(sys.argv) < 2:
        print("❌ Por favor informe a URL do seu serviço no Cloud Run.")
        print("Exemplo: python configurar_webhook_cloudrun.py https://meu-bot-xyz-uc.a.run.app")
        sys.exit(1)

    url_base = sys.argv[1].rstrip('/')
    webhook_url = f"{url_base}/webhook"

    print(f"🔗 Registrando Webhook no Telegram: {webhook_url}")
    bot.remove_webhook()
    resultado = bot.set_webhook(url=webhook_url)

    if resultado:
        print("✅ Webhook configurado com sucesso no Telegram!")
        info = bot.get_webhook_info()
        print(f"📡 Status do Webhook:")
        print(f"   URL: {info.url}")
        print(f"   Mensagens pendentes: {info.pending_update_count}")
    else:
        print("❌ Falha ao configurar Webhook.")

if __name__ == "__main__":
    main()
