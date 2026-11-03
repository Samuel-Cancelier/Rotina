@echo off
title App Rotina & Metas
color 0b

echo =======================================================
echo    INICIANDO APP DE ROTINA, CHECK-IN E METAS
echo =======================================================
echo.

:: Garante que o Node.js esta no PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [INFO] Instalando dependencias do frontend...
    call npm install
)

echo.
echo [OK] Abrindo servidor local do painel...
echo Acesse: http://localhost:3030
echo.

start http://localhost:3030
call npm run dev
