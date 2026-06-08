#!/bin/bash

# ==============================================================================
# PPOB-ONLIMO Deployment Script
# This script builds the Next.js app and restarts it using PM2.
# ==============================================================================

# Exit on error
set -e

echo "🚀 Starting Deployment Process..."

# 1. Install dependencies (Optional, uncomment if needed)
# echo "📦 Installing dependencies..."
# npm install

# 2. Build the application
echo "🏗️ Building the application..."
npm run build

# 3. Handle PM2 Process
APP_NAME="ppob"

if pm2 list | grep -q "$APP_NAME"; then
    echo "♻️ Restarting existing PM2 process: $APP_NAME..."
    pm2 restart $APP_NAME
else
    echo "🆕 Starting new PM2 process: $APP_NAME..."
    pm2 start npm --name "$APP_NAME" -- start
fi

echo "✅ Deployment Successful!"
pm2 status $APP_NAME
