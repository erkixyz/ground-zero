#!/usr/bin/env bash
set -e

DEV=0
for arg in "$@"; do
  case $arg in
    --dev|-d|dev) DEV=1 ;;
  esac
done

if ! docker info > /dev/null 2>&1; then
  echo "Docker ei tööta. Palun käivita Docker Desktop esmalt."
  exit 1
fi

if [ "$DEV" -eq 1 ]; then
  echo "Käivitan ARENDUS-režiimis..."
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
else
  echo "Käivitan TOOTMIS-režiimis..."
  docker compose up --build -d
fi

echo ""
echo "Teenused on käivitatud:"
echo "  Frontend :  http://localhost:3000"
echo "  API      :  http://localhost:3001"
echo "  MinIO    :  http://localhost:9001"
echo "  HAProxy  :  http://localhost:8404"
echo ""
echo "Logide vaatamiseks: docker compose logs -f"
