@echo off
title Cydens - Instalador de Servidor de Impresion

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Se necesitan permisos de Administrador.
    echo  Click derecho -> "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

set INSTALL_DIR=C:\cydens-print

echo Creando directorio de instalacion...
mkdir "%INSTALL_DIR%" 2>nul

echo Copiando archivos...
copy /y "%~dp0cydens-print-server.exe" "%INSTALL_DIR%\" >nul
copy /y "%~dp0update-runner.bat"       "%INSTALL_DIR%\" >nul
copy /y "%~dp0startup-launcher.vbs"    "%INSTALL_DIR%\" >nul

echo Configurando inicio automatico con Windows...
schtasks /delete /tn "CydensPrintServer" /f >nul 2>&1
schtasks /create /tn "CydensPrintServer" ^
  /tr "wscript.exe \"%INSTALL_DIR%\startup-launcher.vbs\"" ^
  /sc onlogon /rl HIGHEST /f >nul

echo Iniciando servidor...
start "" wscript.exe "%INSTALL_DIR%\startup-launcher.vbs"

echo.
echo ========================================
echo  Instalacion completada!
echo.
echo  El servidor iniciara automaticamente
echo  al encender la PC.
echo.
echo  Para desinstalar: desinstalar.bat
echo ========================================
echo.
pause
