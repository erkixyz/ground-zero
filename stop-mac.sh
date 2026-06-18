#!/usr/bin/env bash
set -e

if ! docker info > /dev/null 2>&1; then
  echo "Docker ei tööta."
  exit 0
fi

echo "Peatan Ground Zero teenused..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans
echo "Kõik teenused peatatud."
