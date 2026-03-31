@echo off
title Cydens - Servidor de Impresion
cd /d "%~dp0"

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Descargalo desde https://nodejs.org
    pause
    exit /b 1
)

echo Instalando dependencias...
call npm install

echo.
echo Iniciando servidor de impresion...
echo Para detenerlo, cerrar esta ventana.
echo.
node server.js
pause
