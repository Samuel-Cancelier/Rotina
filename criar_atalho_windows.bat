@echo off
set SCRIPT_DIR=%~dp0
set TARGET_BAT=%SCRIPT_DIR%iniciar_app.bat

echo Criando atalho na sua Area de Trabalho...

set VBS_SCRIPT=%TEMP%\criar_atalho_temp.vbs
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Rotina e Metas.lnk" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%TARGET_BAT%" >> "%VBS_SCRIPT%"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%VBS_SCRIPT%"
echo oLink.Description = "Sistema de Gestao de Rotina e Metas" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

echo.
echo ========================================================
echo  SUCESSO! Atalho "Rotina e Metas" criado na sua 
echo  Area de Trabalho (Desktop)!
echo  Basta dar dois cliques nele para abrir o sistema!
echo ========================================================
pause
