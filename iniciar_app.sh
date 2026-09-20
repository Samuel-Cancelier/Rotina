#!/usr/bin/env bash
# Script para iniciar o sistema completo no Mac ou Linux
cd "$(dirname "$0")"

echo "======================================================="
echo "   INICIANDO O SISTEMA DE ROTINA & METAS COMPLETO"
echo "======================================================="

# Detecta venv
PY_CMD="python3"
if [ -f "venv/bin/python" ]; then
    echo "[OK] Ambiente virtual encontrado: venv/"
    source venv/bin/activate
    PY_CMD="python"
elif [ -f ".venv/bin/python" ]; then
    echo "[OK] Ambiente virtual encontrado: .venv/"
    source .venv/bin/activate
    PY_CMD="python"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
fi

echo "Iniciando Backend Python (API + Telegram Bot)..."
$PY_CMD main.py &
PY_PID=$!

trap "kill $PY_PID 2>/dev/null; exit" INT TERM EXIT

sleep 2

# Abre o navegador
if which xdg-open > /dev/null; then
    xdg-open http://localhost:3000 &
elif which open > /dev/null; then
    open http://localhost:3000 &
fi

echo "Iniciando painel web local..."
npm run dev
