@echo off

docker info > nul 2>&1
if errorlevel 1 (
  echo Docker ei tööta.
  exit /b 0
)

echo Peatan Ground Zero teenused...
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans
echo Koik teenused peatatud.
