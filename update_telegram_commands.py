import json
import urllib.request

TOKEN = "8949673934:AAEjhmDizSs0hbhhDVXDnNXf8fLr1PA1KlQ"

commands = [
    {"command": "start", "description": "Mensagem de boas-vindas"},
    {"command": "help", "description": "Ajuda completa e guia rápido"},
    {"command": "feito", "description": "Lança progresso (ex: /feito corrida 5)"},
    {"command": "score", "description": "Ver Score Geral ponderado do mês"},
    {"command": "pilares", "description": "Ver os 5 Pilares e suas metas"},
    {"command": "categorias", "description": "Ver categorias quantitativas"},
    {"command": "atividades", "description": "Ver atividades cadastradas"},
    {"command": "nova_atividade", "description": "Criar nova atividade (com botões)"},
    {"command": "agendar", "description": "Agendar tarefa pontual"},
    {"command": "rotina", "description": "Agendar atividade da rotina"},
    {"command": "agenda", "description": "Ver agendamentos pendentes de hoje"}
]

url = f"https://api.telegram.org/bot{TOKEN}/setMyCommands"
data = json.dumps({"commands": commands}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        print("Resposta do Telegram:", response.read().decode())
except Exception as e:
    print("Erro:", e)
