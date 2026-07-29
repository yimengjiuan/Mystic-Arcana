@rem Build & serve for local dev
@echo off
if not exist node_modules (
  echo [1/3] Installing dependencies...
  call npm install
  if errorlevel 1 goto err
)
echo [2/3] Building UI...
call npm run build:ui
if errorlevel 1 goto err
echo [3/3] Starting server...
start http://localhost:5173/
call npm run serve
goto :eof
:err
echo.
echo Build failed. Press any key to exit.
pause >nul
