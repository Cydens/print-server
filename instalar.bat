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
set PRINTERS_TMP=%TEMP%\cydens-printers.txt

echo.
echo ========================================
echo  Cydens - Instalador de Impresion
echo ========================================
echo.
echo Buscando impresoras instaladas...
echo.

:: Listar impresoras numeradas y guardar lista en temp
powershell -ExecutionPolicy Bypass -Command ^
  "$p = Get-Printer | Select-Object -ExpandProperty Name; " ^
  "for ($i=0; $i -lt $p.Count; $i++) { Write-Host ('  [' + ($i+1) + '] ' + $p[$i]) }; " ^
  "$p | Out-File -FilePath '%PRINTERS_TMP%' -Encoding UTF8"

echo.
set /p PRINTER_NUM=Ingresa el numero de la impresora:

:: Obtener el nombre segun el numero elegido
for /f "usebackq delims=" %%a in (`powershell -ExecutionPolicy Bypass -Command ^
  "$p = Get-Content '%PRINTERS_TMP%' | Where-Object { $_.Trim() -ne '' }; " ^
  "$p[[int]'%PRINTER_NUM%'-1].Trim()"`) do set PRINTER_NAME=%%a

if "%PRINTER_NAME%"=="" (
    echo.
    echo  ERROR: Numero invalido. Reinicia el instalador.
    pause
    exit /b 1
)

echo.
echo  Impresora seleccionada: %PRINTER_NAME%
echo.

:: Instalar
echo Copiando archivos a %INSTALL_DIR%...
mkdir "%INSTALL_DIR%" 2>nul
copy /y "%~dp0cydens-print-server.exe" "%INSTALL_DIR%\" >nul
copy /y "%~dp0update-runner.bat"       "%INSTALL_DIR%\" >nul
copy /y "%~dp0startup-launcher.vbs"    "%INSTALL_DIR%\" >nul

:: Guardar configuracion
echo {"printer":"%PRINTER_NAME%"} > "%INSTALL_DIR%\config.json"

:: Inicio automatico
echo Configurando inicio automatico...
schtasks /delete /tn "CydensPrintServer" /f >nul 2>&1
schtasks /create /tn "CydensPrintServer" ^
  /tr "wscript.exe \"%INSTALL_DIR%\startup-launcher.vbs\"" ^
  /sc onlogon /rl HIGHEST /f >nul

:: Arrancar ahora
echo Iniciando servidor...
start "" wscript.exe "%INSTALL_DIR%\startup-launcher.vbs"

del "%PRINTERS_TMP%" >nul 2>&1

echo.
echo ========================================
echo  Instalacion completada!
echo.
echo  Impresora : %PRINTER_NAME%
echo  Puerto    : 3001
echo.
echo  El servidor iniciara automaticamente
echo  al encender la PC.
echo ========================================
echo.
pause
