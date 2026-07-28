@rem Build & serve for local dev
@echo off
if not exist node_modules (
  echo [1/4] Installing dependencies...
  call npm install
  if errorlevel 1 goto err
)
echo [2/4] Building TypeScript...
call npm run build
if errorlevel 1 goto err
echo [3/4] Copying UI assets...
node scripts/copy-ui.mjs
echo [4/4] Patching ESM imports + starting server...
node scripts/fix-imports.mjs
start http://localhost:5173/
call npm run serve
goto :eof
:err
echo.
echo Build failed. Press any key to exit.
pause >nul
