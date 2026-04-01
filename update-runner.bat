@echo off
:: Esperar a que el servidor responda al cliente antes de matarlo
timeout /t 3 /nobreak >nul

set INSTALL_DIR=%~dp0

echo Descargando nueva version...
powershell -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/Cydens/print-server/releases/latest/download/cydens-print-server.exe' -OutFile '%INSTALL_DIR%cydens-print-server-new.exe' -UseBasicParsing"

if not exist "%INSTALL_DIR%cydens-print-server-new.exe" (
    echo ERROR: No se pudo descargar la actualizacion.
    exit /b 1
)

echo Reemplazando ejecutable...
taskkill /f /im cydens-print-server.exe >nul 2>&1
timeout /t 1 /nobreak >nul
move /y "%INSTALL_DIR%cydens-print-server-new.exe" "%INSTALL_DIR%cydens-print-server.exe"

echo Reiniciando...
start "" wscript.exe "%INSTALL_DIR%startup-launcher.vbs"
