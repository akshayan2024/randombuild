@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Random Buildings launcher (backend + frontend)
rem Backend:  http://127.0.0.1:8002
rem Frontend: http://127.0.0.1:5175

set "ROOT=%~dp0"
rem Remove trailing backslash to avoid cmd quoting edge-cases like "C:\path\"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "SERVER_PORT=8002"
set "WEB_PORT=5175"
set "LOG_DIR=%ROOT%\logs"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >NUL 2>&1

echo === Random Buildings: stopping previous instances ===

taskkill /F /T /FI "WINDOWTITLE eq RandomBuildings-Server*" >NUL 2>&1
taskkill /F /T /FI "WINDOWTITLE eq RandomBuildings-Web*" >NUL 2>&1

call :kill_port %SERVER_PORT%
call :kill_port %WEB_PORT%

echo === Random Buildings: starting ===
echo Backend:  http://127.0.0.1:%SERVER_PORT%/health
echo Frontend: http://127.0.0.1:%WEB_PORT%/

rem NOTE: Keep it simple (no redirection) to avoid Windows cmd quoting pitfalls with spaces.
start "RandomBuildings-Server" /D "%ROOT%" cmd /k "npm run dev:server"
call :wait_port %SERVER_PORT% 20
start "RandomBuildings-Web" /D "%ROOT%" cmd /k "npm run dev:web"

echo Done.
exit /b 0

:wait_port
set "PORT=%~1"
set "TRIES=%~2"
set /a COUNT=0
:wait_port_loop
set /a COUNT+=1
rem Check for LISTENING on the port (best-effort)
netstat -aon | findstr /C:":%PORT% " | findstr /C:"LISTENING" >NUL 2>&1
if %ERRORLEVEL%==0 (
  echo Backend is listening on %PORT%.
  exit /b 0
)
if %COUNT% GEQ %TRIES% (
  echo Backend did not start on %PORT% after %TRIES% seconds. Check the server window for errors.
  exit /b 0
)
ping 127.0.0.1 -n 2 >NUL
goto wait_port_loop

:kill_port
set "PORT=%~1"
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING 2^>NUL') do (
  echo Killing PID %%p on port %PORT%...
  taskkill /F /PID %%p >NUL 2>&1
)
exit /b 0
