@echo off
title Deploy Cloudflare Worker
color 0b

echo ========================================================
echo    PUBLICANDO WORKER NA CLOUDFLARE (API FIRESTORE)
echo ========================================================
echo.

set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

call npx wrangler deploy

echo.
pause
