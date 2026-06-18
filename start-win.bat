@echo off
setlocal

docker info > nul 2>&1
if errorlevel 1 (
  echo Docker ei tööta. Palun käivita Docker Desktop esmalt.
  exit /b 1
)

echo Käivitan ARENDUS-režiimis...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

echo.
echo Kontrollin konteinereid...

:check_loop
set CREATED_COUNT=0
for /f "tokens=*" %%C in ('docker compose ps --all --format "{{.Name}} {{.State}}" 2^>nul') do (
  echo %%C | findstr /i " created" > nul
  if not errorlevel 1 (
    set /a CREATED_COUNT+=1
    for /f "tokens=1" %%N in ("%%C") do (
      echo   Käivitan konteineri: %%N
      docker start %%N > nul 2>&1
    )
  )
)

if %CREATED_COUNT% GTR 0 (
  timeout /t 5 /nobreak > nul
  goto check_loop
)

echo.
echo Teenused on käivitatud:
echo   Frontend :  http://localhost:3000  (load balancer -^> web + web-2)
echo   API      :  http://localhost:3001  (load balancer -^> api + api-2)
echo   MinIO    :  http://localhost:9001
echo   Nginx LB :  http://localhost:8080/nginx-status
echo   HAProxy  :  http://localhost:8404  (postgres read LB)
echo   Redis LB :  http://localhost:8405  (redis LB stats)
echo.
echo Logide vaatamiseks: docker compose logs -f

endlocal
