@echo off
setlocal
cd /d "%~dp0"
title BurgerShot - Caja auxiliar
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js LTS desde https://nodejs.org y vuelve a abrir este archivo.
  pause
  exit /b 1
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo Preparando BurgerShot. La primera vez necesita Internet y puede tardar unos minutos.
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    echo No se pudo preparar la aplicacion. Revisa tu conexion y vuelve a intentarlo.
    pause
    exit /b 1
  )
)
call npm start
if errorlevel 1 pause
endlocal
