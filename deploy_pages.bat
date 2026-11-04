@echo off
title Deploy App no Cloudflare Pages (Mobile / Web)
color 0b

echo ========================================================
echo    PUBLICANDO APP NO CLOUDFLARE PAGES (100% GRATUITO)
echo ========================================================
echo.

set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo [1/2] Gerando build de producao...
cd frontend
call npm run build
cd ..

echo.
echo [2/2] Enviando para o Cloudflare Pages...
call npx wrangler pages deploy dist --project-name rotina-metas-web

echo.
echo ========================================================
echo [OK] Deploy concluido! Acesse pelo link acima no celular.
echo ========================================================
pause
