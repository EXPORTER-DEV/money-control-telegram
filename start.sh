#!/bin/bash
# Docker up
npm ci --only=production --ignore-scripts
npm run build
docker-compose -f docker-compose.yml build --no-cache
docker-compose -f docker-compose.yml up -d --force-recreate