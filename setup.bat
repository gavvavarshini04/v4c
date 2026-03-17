@echo off
echo Installing dependencies with legacy-peer-deps...
npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo npm install failed. Trying bun install...
    bun install
)
echo.
echo Setup complete. Starting development server...
npm run dev
