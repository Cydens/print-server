@echo off
title Cydens - Instalar Servicio de Impresion

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Se necesitan permisos de Administrador.
    echo  Click derecho en este archivo y elegir
    echo  "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR al instalar dependencias.
    pause
    exit /b 1
)

echo.
echo Instalando servicio de Windows...
node instalar-servicio.js

echo.
pause
