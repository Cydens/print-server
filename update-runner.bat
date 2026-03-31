@echo off
:: Este script es llamado por el servidor para actualizarse
:: Espera 2 segundos para que el servidor responda al cliente primero
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."
git pull origin main

cd print-server
call npm install

net stop "Cydens Print Server"
net start "Cydens Print Server"
