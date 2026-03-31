@echo off
title Cydens - Actualizar Servidor de Impresion

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Se necesitan permisos de Administrador.
    echo  Click derecho -> "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

:: Ir a la raiz del repositorio (un nivel arriba de print-server)
cd /d "%~dp0\.."

echo Deteniendo servicio...
net stop "Cydens Print Server" >nul 2>&1

echo Descargando actualizaciones desde GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo.
    echo  ERROR al descargar actualizaciones.
    echo  Verificar conexion a internet y que git este instalado.
    echo.
    net start "Cydens Print Server" >nul 2>&1
    pause
    exit /b 1
)

echo Actualizando dependencias...
cd print-server
call npm install

echo Iniciando servicio...
net start "Cydens Print Server"

echo.
echo ========================================
echo  Actualizacion completada correctamente
echo ========================================
echo.
pause
