"""
Bot do Telegram para Gestão de Rotina, Metas e Pilares (bot.py)
Totalmente integrado ao Firebase Firestore e compatível com Deploy em Nuvem.

Comandos principais:
/start              - Mensagem de boas-vindas e guia rápido
/feito [cat] [ativ] [qtd] - Lança progresso na categoria e converte em pontos no Pilar Soberano
/score              - Relatório consolidado do Score Geral e dos 5 Pilares
/pilares            - Lista os 5 Pilares Soberanos com suas metas de pontos
/categorias         - Lista as categorias quantitativas
/atividades         - Lista as atividades cadastradas
/nova_atividade     - Fluxo guiado para cadastrar nova atividade vinculada a categoria
/help               - Ajuda completa
"""

import os
import telebot
from telebot import types
from dotenv import load_dotenv

load_dotenv()

from database import (
    listar_pilares,
    listar_categorias_dict,
    obter_categoria,
    cadastrar_atividade,
    listar_atividades_dict,
    registrar_feito,
    calcular_score_geral
)

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8949673934:AAEjhmDizSs0hbhhDVXDnNXf8fLr1PA1KlQ")
bot = telebot.TeleBot(TOKEN)

# Sessões temporárias para fluxos em etapas
user_sessions = {}

# =====================================================================
# 1. COMANDOS GERAIS
# =====================================================================

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    texto = (
        "👋 *Bem-vindo ao Sistema de Gestão de Rotina & Metas!*\n\n"
        "🏛️ *Arquitetura Soberana:*\n"
        "1. *Pilares Soberanos* - Pontuação agregada (0-100 pts)\n"
        "2. *Categorias Quantitativas* - Metas puras (km, págs, horas)\n"
        "3. *Atividades* - Hábitos segmentados (Parque vs Esteira)\n\n"
        "⚡ *Comandos do Dia a Dia:*\n"
        "• `/feito corrida Parque 5` - Lança 5 km e gera pontos no Pilar Atividade Física\n"
        "• `/score` - Ver o Score Geral ponderado do mês\n"
        "• `/pilares` - Ver os 5 Pilares e metas de pontos\n"
        "• `/categorias` - Ver categorias e conversão em pontos\n"
        "• `/atividades` - Ver atividades cadastradas\n"
        "• `/nova_atividade` - Cadastrar nova atividade com botões"
    )
    bot.reply_to(message, texto, parse_mode="Markdown")

# =====================================================================
# 2. LANÇAMENTO DIRETO: /feito
# =====================================================================

@bot.message_handler(commands=['feito'])
def processar_feito(message):
    texto = message.text.replace('/feito', '').strip()
    partes = texto.split()

    if len(partes) < 3:
        instrucao = (
            "📋 *Como lançar uma atividade realizada:*\n\n"
            "Envie no formato:\n"
            "`/feito [categoria] [atividade] [quantidade]`\n\n"
            "*Exemplos práticos:*\n"
            "• `/feito corrida Parque 5` (5 km de corrida no Parque)\n"
            "• `/feito corrida Esteira 4.5` (4.5 km na Esteira)\n"
            "• `/feito leitura Habitos 30` (30 páginas lidas)\n"
            "• `/feito futsal Pelada 1.5` (1.5 horas de jogo)"
        )
        bot.reply_to(message, instrucao, parse_mode="Markdown")
        return

    cat_input = partes[0]
    qtd_str = partes[-1].replace(',', '.')
    ativ_nome = " ".join(partes[1:-1])

    try:
        valor = float(qtd_str)
    except ValueError:
        bot.reply_to(message, "⚠️ A quantidade deve ser um número! Exemplo: `/feito corrida Parque 5`", parse_mode="Markdown")
        return

    try:
        res = registrar_feito(cat_input, ativ_nome, valor)
        sucesso_msg = (
            "✅ *Lançamento concluído no Firestore!*\n\n"
            f"📁 *Categoria:* {res['categoria_nome']}\n"
            f"📌 *Atividade:* {res['atividade_nome']}\n"
            f"➕ *Registrado:* `+{res['valor_lancado']} {res['unidade']}` (Total no mês: `{res['total_acumulado']} {res['unidade']}`)\n"
            f"⚡ *Pontos Gerados:* `+{res['pontos_gerados']} pts` para o pilar *{res['pilar_nome']}*\n\n"
            "_O Score Geral e a plataforma Web foram atualizados em tempo real!_"
        )
        bot.reply_to(message, sucesso_msg, parse_mode="Markdown")
    except Exception as e:
        bot.reply_to(message, f"❌ Erro ao registrar: {str(e)}", parse_mode="Markdown")

# =====================================================================
# 3. RELATÓRIO DO SCORE GERAL: /score
# =====================================================================

@bot.message_handler(commands=['score'])
def processar_score(message):
    try:
        dados = calcular_score_geral()
        score = dados["score_geral"]
        mes = dados["mes"]
        ano = dados["ano"]

        linhas = [
            f"📊 *SCORE GERAL DOS PILARES ({mes:02d}/{ano})*\n",
            f"🏆 *Score Geral:* `{score}/100 pts`\n",
            "*Desempenho por Pilar Soberano:*"
        ]

        for p in dados["pilares"]:
            if p["informativo"]:
                linhas.append(f"• *{p['nome']}*: Registro livre (sem meta)")
            else:
                barra = "🟢" if p["atingimento"] >= 80 else ("🟡" if p["atingimento"] >= 50 else "🔴")
                linhas.append(
                    f"• {barra} *{p['nome']}* (Peso {p['peso']}%) - `{p['pontos']}/{p['meta']} pts` ({p['atingimento']}%)"
                )

        linhas.append("\n_Pontos gerados automaticamente pelas categorias correspondentes._")
        bot.reply_to(message, "\n".join(linhas), parse_mode="Markdown")
    except Exception as e:
        bot.reply_to(message, f"❌ Erro ao calcular score: {str(e)}", parse_mode="Markdown")

# =====================================================================
# 4. LISTAR PILARES E CATEGORIAS
# =====================================================================

@bot.message_handler(commands=['pilares'])
def ver_pilares(message):
    pilares = listar_pilares()
    linhas = ["🏛️ *5 Pilares Soberanos (Nível 1):*\n"]
    for p in pilares:
        if p.get("tem_meta"):
            linhas.append(
                f"*{p.get('numero')}. {p.get('nome')}*\n"
                f"   🎯 Meta: `{p.get('meta_pontos_mensal')} pontos/mês` | Peso no Score: `{p.get('peso_no_score_geral')}%`"
            )
        else:
            linhas.append(f"*{p.get('numero')}. {p.get('nome')}* (Sem meta obrigatória)")
    bot.reply_to(message, "\n".join(linhas), parse_mode="Markdown")

@bot.message_handler(commands=['categorias'])
def ver_categorias(message):
    categorias = listar_categorias_dict()
    if not categorias:
        bot.reply_to(message, "📭 Nenhuma categoria encontrada no Firestore.")
        return

    linhas = ["📁 *Categorias Quantitativas (Nível 2):*\n"]
    for c in categorias:
        meta_str = f"`{c.get('meta_mensal')} {c.get('unidade_padrao')}`" if c.get("meta_mensal", 0) > 0 else "Sem meta fixa"
        linhas.append(
            f"• *{c.get('nome')}* (1 {c.get('unidade_padrao')} = `{c.get('pontos_por_unidade')} pts`)\n"
            f"   Meta Pura: {meta_str}"
        )
    bot.reply_to(message, "\n".join(linhas), parse_mode="Markdown")

@bot.message_handler(commands=['atividades'])
def ver_atividades(message):
    atividades = listar_atividades_dict()
    if not atividades:
        bot.reply_to(message, "📭 Nenhuma atividade cadastrada. Use `/nova_atividade` para criar uma!")
        return

    linhas = ["🔹 *Atividades Segmentadas (Nível 3):*\n"]
    for a in atividades:
        linhas.append(f"• *{a.get('nome')}* ➔ Categoria: _{a.get('categoria_nome')}_ (`{a.get('unidade')}`)")
    bot.reply_to(message, "\n".join(linhas), parse_mode="Markdown")

# =====================================================================
# 5. CADASTRO DE NOVA ATIVIDADE VIA TELEGRAM
# =====================================================================

@bot.message_handler(commands=['nova_atividade'])
def iniciar_cadastro_atividade(message):
    msg = bot.reply_to(
        message,
        "✍️ *Qual é o nome da nova atividade?*\n"
        "Exemplo: `Parque da Cidade`, `Esteira`, `Livro Hábitos Atômicos`",
        parse_mode="Markdown"
    )
    bot.register_next_step_handler(msg, passo_escolha_categoria)

def passo_escolha_categoria(message):
    nome_ativ = message.text.strip()
    if not nome_ativ:
        bot.reply_to(message, "⚠️ Nome inválido. Tente novamente com `/nova_atividade`.")
        return

    chat_id = message.chat.id
    user_sessions[chat_id] = {"nome": nome_ativ}

    categorias = listar_categorias_dict()
    if not categorias:
        bot.reply_to(message, "⚠️ Nenhuma categoria cadastrada no banco de dados.")
        return

    markup = types.InlineKeyboardMarkup(row_width=2)
    botoes = [
        types.InlineKeyboardButton(
            f"📁 {c['nome']}",
            callback_data=f"cat_{c['id']}"
        )
        for c in categorias
    ]
    markup.add(*botoes)

    bot.send_message(
        chat_id,
        f"🎯 Atividade: *{nome_ativ}*\n\nSelecione a qual *Categoria* ela pertence:",
        reply_markup=markup,
        parse_mode="Markdown"
    )

@bot.callback_query_handler(func=lambda call: call.data.startswith("cat_"))
def salvar_atividade_callback(call):
    chat_id = call.message.chat.id
    cat_id = call.data.replace("cat_", "")

    if chat_id not in user_sessions:
        bot.answer_callback_query(call.id, "Sessão expirada. Comece novamente com /nova_atividade.")
        return

    nome_ativ = user_sessions[chat_id].get("nome")
    cat = obter_categoria(cat_id)

    try:
        cadastrar_atividade(
            nome=nome_ativ,
            categoria_id=cat_id,
            recorrente=True,
            afeta_meta=True
        )
        bot.edit_message_text(
            f"🎉 *Atividade cadastrada com sucesso!*\n\n"
            f"📌 *Nome:* {nome_ativ}\n"
            f"📁 *Categoria:* {cat.get('nome') if cat else cat_id}\n\n"
            f"Agora você pode lançar: `/feito {cat_id} {nome_ativ} 5`",
            chat_id=chat_id,
            message_id=call.message.message_id,
            parse_mode="Markdown"
        )
    except Exception as e:
        bot.send_message(chat_id, f"❌ Erro ao salvar: {str(e)}")
    finally:
        if chat_id in user_sessions:
            del user_sessions[chat_id]

# =====================================================================
# INICIALIZAÇÃO CONTÍNUA (NUVEM OU LOCAL)
# =====================================================================

if __name__ == "__main__":
    print("🚀 Bot Python de Rotina & Metas iniciado (Modo Local / Polling)!")
    print("📡 Removendo qualquer webhook anterior para habilitar polling local...")
    try:
        bot.remove_webhook()
    except Exception as e:
        print(f"Aviso ao remover webhook: {e}")
    print("📡 Aguardando comandos do Telegram...")
    bot.infinity_polling(timeout=20, long_polling_timeout=15)
