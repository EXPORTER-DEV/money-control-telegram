#!/bin/bash
# Docker up
npm run build
docker-compose -f docker-compose.yml build --no-cache
docker-compose -f docker-compose.yml up -d --force-recreate