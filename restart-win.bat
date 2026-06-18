@echo off
setlocal

docker info > nul 2>&1
if errorlevel 1 (
  echo Docker ei tööta. Palun käivita Docker Desktop esmalt.
  exit /b 1
)

echo Peatan teenused...
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans

echo.
echo Kaivitan ARENDUS-reziimis...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

echo.
echo Teenused on kaivitatud:
echo   Frontend  :  http://localhost:3000
echo   API       :  http://localhost:3001
echo   MinIO     :  http://localhost:9001
echo   RabbitMQ  :  http://localhost:15672  (guest/guest)
echo   Nginx LB  :  http://localhost:8080/nginx-status
echo   HAProxy   :  http://localhost:8404
echo   Redis LB  :  http://localhost:8405
echo   Prometheus:  http://localhost:9090
echo   Grafana   :  http://localhost:3002  (admin/admin)
echo   Loki      :  http://localhost:3100
echo.
echo Logide vaatamiseks: docker compose logs -f

endlocal
