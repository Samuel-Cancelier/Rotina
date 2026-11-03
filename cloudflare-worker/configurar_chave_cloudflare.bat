@echo off
title Configurar Chave Firebase na Cloudflare
color 0a

echo ========================================================
echo    CONFIGURANDO CHAVE PRIVADA DO FIREBASE NA CLOUDFLARE
echo ========================================================
echo.

:: Garante que o Node.js esta no PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

cd /d "%~dp0"

echo [1/2] Verificando login na Cloudflare...
call npx wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Abrindo navegador para login na Cloudflare...
    call npx wrangler login
)

echo.
echo [2/2] Cadastrando o segredo FIREBASE_PRIVATE_KEY...
echo Quando pedir, cole o texto da chave privada (que comeca com -----BEGIN PRIVATE KEY-----)
echo.

call npx wrangler secret put FIREBASE_PRIVATE_KEY

echo.
echo ========================================================
echo [OK] Chave configurada com sucesso!
echo ========================================================
pause
