@echo off
title Gestao de Rotina e Metas - Sistema Completo
color 0b

echo =======================================================
echo    INICIANDO SISTEMA DE ROTINA E METAS
echo =======================================================
echo.

:: 0. Verificar se os arquivos do projeto estao nesta pasta
if not exist "package.json" (
    echo [ERRO] O arquivo package.json nao foi encontrado nesta pasta!
    echo Causa comum: Ao descompactar o ZIP, os arquivos ficaram dentro de uma subpasta.
    pause
    exit /b
)

:: 1. Detectar comando Python e venv
set PY_CMD=python
if exist "venv\Scripts\python.exe" (
    echo [OK] Ambiente virtual encontrado: venv\
    set PY_CMD=venv\Scripts\python.exe
    call venv\Scripts\activate.bat >nul 2>nul
) else if exist ".venv\Scripts\python.exe" (
    echo [OK] Ambiente virtual encontrado: .venv\
    set PY_CMD=.venv\Scripts\python.exe
    call .venv\Scripts\activate.bat >nul 2>nul
) else (
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        where py >nul 2>nul
        if %errorlevel% equ 0 (
            set PY_CMD=py
        )
    )
)

:: 2. Instalação de dependências do Node (se necessário)
echo [1/3] Verificando dependencias do painel (Node.js)...
if not exist "frontend\node_modules\" (
    echo       Instalando pacotes do painel, aguarde um instante...
    call npm install
) else (
    echo       Painel web pronto.
)

:: 3. Iniciar Servidor Python (API Flask na porta 8080 + Bot do Telegram)
echo [2/3] Iniciando Servidor Python (main.py: API + Bot Telegram)...
start "Servidor Python (API e Bot)" /min "%PY_CMD%" main.py

:: 4. Abrir navegador e iniciar o frontend
echo [3/3] Abrindo o painel no seu navegador...
timeout /t 2 /nobreak >nul
start "" http://localhost:3000

echo.
echo =======================================================
echo  TUDO RODANDO AUTOMATICAMENTE:
echo   - Backend Python rodando em segundo plano (main.py)
echo   - Conectado ao Firebase Firestore
echo   - Bot do Telegram ativo para receber /feito
echo   - Painel Web aberto em: http://localhost:3000
echo.
echo  Para encerrar o sistema, basta fechar esta janela.
echo =======================================================
echo.

call npm run dev
pause
