@echo off
echo 🚀 Запуск Карты Судьбы...
echo.
set PORT=%1
if "%PORT%"=="" set PORT=8080
node server.mjs %PORT%
pause
