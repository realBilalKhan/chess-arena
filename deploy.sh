#!/bin/bash

echo "Starting deployment..."

cd ~/chess-arena/server

echo "Installing dependencies..."
npm install

mkdir -p logs

pkill -f "node.*server.js" || true

echo "Starting application..."
if command -v pm2 &> /dev/null || [ -f "./node_modules/.bin/pm2" ]; then
    npx pm2 restart ecosystem.config.cjs 2>/dev/null || npx pm2 start ecosystem.config.cjs
    npx pm2 status
else
    echo "PM2 not found, using nohup as fallback..."
    nohup node server.js > logs/server.log 2>&1 &
    echo $! > server.pid
    echo "Server started with PID: $(cat server.pid)"
fi

echo "Deployment completed!"