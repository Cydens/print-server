@echo off
title Cydens - Desinstalar Servicio de Impresion

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Se necesitan permisos de Administrador.
    echo  Click derecho -> "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"
node desinstalar-servicio.js

echo.
pause
