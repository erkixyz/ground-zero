#!/usr/bin/env bash
set -e

if ! docker info > /dev/null 2>&1; then
  echo "Docker ei tööta. Palun käivita Docker Desktop esmalt."
  exit 1
fi

echo "Käivitan ARENDUS-režiimis..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

echo ""
echo "Teenused on käivitatud:"
echo "  Frontend   :  http://localhost:3000"
echo "  API        :  http://localhost:3001"
echo "  Swagger    :  http://localhost:3001/docs"
echo "  pgAdmin    :  http://localhost:5050    (admin@admin.com / admin)"
echo "  MinIO      :  http://localhost:9001    (minioadmin / minioadmin123)"
echo "  RabbitMQ   :  http://localhost:15672   (guest / guest)"
echo "  Grafana    :  http://localhost:3002    (admin / admin)"
echo "  Prometheus :  http://localhost:9090"
echo "  Nginx LB   :  http://localhost:8080/nginx-status"
echo "  HAProxy DB :  http://localhost:8404"
echo "  HAProxy Redis: http://localhost:8405"
echo ""
echo "Logide vaatamiseks: docker compose logs -f"
