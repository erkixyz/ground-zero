@echo off
setlocal

set DEV=0
for %%A in (%*) do (
  if /i "%%A"=="--dev" set DEV=1
  if /i "%%A"=="-d"    set DEV=1
  if /i "%%A"=="dev"   set DEV=1
)

docker info > nul 2>&1
if errorlevel 1 (
  echo Docker ei tööta. Palun käivita Docker Desktop esmalt.
  exit /b 1
)

if "%DEV%"=="1" (
  echo Käivitan ARENDUS-režiimis...
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
) else (
  echo Käivitan TOOTMIS-režiimis...
  docker compose up --build -d
)

echo.
echo Teenused on käivitatud:
echo   Frontend :  http://localhost:3000
echo   API      :  http://localhost:3001
echo   MinIO    :  http://localhost:9001
echo   HAProxy  :  http://localhost:8404
echo.
echo Logide vaatamiseks: docker compose logs -f

endlocal
