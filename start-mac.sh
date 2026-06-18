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
echo "  Frontend :  http://localhost:3000  (load balancer → web + web-2)"
echo "  API      :  http://localhost:3001  (load balancer → api + api-2)"
echo "  MinIO    :  http://localhost:9001"
echo "  Nginx LB :  http://localhost:8080/nginx-status"
echo "  HAProxy  :  http://localhost:8404  (postgres read LB)"
echo "  Redis LB :  http://localhost:8405  (redis LB stats)"
echo "  RabbitMQ :  http://localhost:15672  (management UI, guest/guest)"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana  :  http://localhost:3002    (admin/admin)"
echo ""
echo "Logide vaatamiseks: docker compose logs -f"
