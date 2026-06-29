@echo off
setlocal

docker info > nul 2>&1
if errorlevel 1 (
  echo Docker ei tööta. Palun käivita Docker Desktop esmalt.
  exit /b 1
)

set GPU_FLAG=
nvidia-smi > nul 2>&1
if errorlevel 1 (
  echo NVIDIA GPU-d ei leitud - kasutan CPU-d
) else (
  echo NVIDIA GPU tuvastatud - kasutan GPU kiirendust
  set GPU_FLAG=-f docker-compose.gpu.yml
)

echo Kaivitan ARENDUS-reziimis...
docker compose -f docker-compose.yml -f docker-compose.dev.yml %GPU_FLAG% up --build -d

echo.
echo Kontrollin konteinereid...

:check_loop
set CREATED_COUNT=0
for /f "tokens=*" %%C in ('docker compose -f docker-compose.yml -f docker-compose.dev.yml %GPU_FLAG% ps --all --format "{{.Name}} {{.State}}" 2^>nul') do (
  echo %%C | findstr /i " created" > nul
  if not errorlevel 1 (
    set /a CREATED_COUNT+=1
    for /f "tokens=1" %%N in ("%%C") do (
      echo   Kaivitan konteineri: %%N
      docker start %%N > nul 2>&1
    )
  )
)

if %CREATED_COUNT% GTR 0 (
  timeout /t 5 /nobreak > nul
  goto check_loop
)

echo.
echo Teenused on kaivitatud:
echo   Frontend    :  http://localhost:3000
echo   API         :  http://localhost:3001
echo   Swagger     :  http://localhost:3001/docs
echo   pgAdmin     :  http://localhost:5050    (admin@admin.com / admin)
echo   MinIO       :  http://localhost:9001    (minioadmin / minioadmin123)
echo   RabbitMQ    :  http://localhost:15672   (guest / guest)
echo   Grafana     :  http://localhost:3002    (admin / admin)
echo   Prometheus  :  http://localhost:9090
echo   Nginx LB    :  http://localhost:8080/nginx-status
echo   HAProxy DB  :  http://localhost:8404
echo   HAProxy Redis: http://localhost:8405
echo   Mailpit     :  http://localhost:8025
echo.
echo Logide vaatamiseks: docker compose logs -f

endlocal
