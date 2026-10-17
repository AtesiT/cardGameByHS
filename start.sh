#!/bin/bash
echo "🚀 Запуск Карты Судьбы..."
echo ""
PORT=${1:-8080}
node server.js $PORT
