# Sistema de Organização de Rotina e Metas (Python + Firestore + Telegram)

Sistema pessoal de gestão de rotina, hábitos e metas recorrentes com cálculo de score ponderado (0 a 100%).

## Estrutura do Projeto

- **`database.py`**: Camada de persistência com `firebase_admin` e Google Cloud Firestore.
  - Funções de `categorias`: `cadastrar_categoria`, `listar_categorias`, `listar_categorias_dict`, `obter_categoria`.
  - Funções de `atividades_cadastradas`: `cadastrar_atividade` (com `DocumentReference` e `categoria_id`), `listar_atividades`, `listar_atividades_dict`.
- **`bot.py`**: Bot do Telegram construído com `pyTelegramBotAPI`.
  - `/start` e `/help`: Boas-vindas e comandos.
  - `/categorias` e `/nova_categoria`: Listagem e cadastro de categorias.
  - `/atividades`: Lista atividades formatadas.
  - `/nova_atividade`: Fluxo interativo com **Inline Keyboard Buttons** para selecionar a categoria sem precisar digitar IDs manualmente!
- **`chave-firebase.json`**: Chave de conta de serviço (Service Account) do Firebase Firestore.
- **`requirements.txt`**: Dependências Python para execução local e no Google Cloud Run.
- **PWA / Web Interface**: Painel interativo de gestão e simulador do Telegram.

## Como Executar o Bot Localmente

```bash
# 1. Instalar as dependências
pip install -r requirements.txt

# 2. Executar o bot
python bot.py
```

## Como Fazer Deploy no Google Cloud Run (Free Tier)

Crie uma imagem de contêiner ou utilize o Buildpack do Cloud Run:

```bash
gcloud run deploy rotina-telegram-bot \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```
