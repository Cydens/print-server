@echo off
title Cydens - Desinstalar Servidor de Impresion

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Se necesitan permisos de Administrador.
    echo  Click derecho -> "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo Deteniendo servidor...
taskkill /f /im cydens-print-server.exe >nul 2>&1

echo Eliminando inicio automatico...
schtasks /delete /tn "CydensPrintServer" /f >nul 2>&1

echo.
echo ========================================
echo  Desinstalado correctamente.
echo  Los archivos en C:\cydens-print
echo  pueden eliminarse manualmente.
echo ========================================
echo.
pause
