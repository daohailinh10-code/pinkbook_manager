@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Can cai Node.js 24 truoc khi chay.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 (
    echo Cai thu vien that bai. Xem thong bao o tren.
    pause
    exit /b 1
  )
)
echo Mo http://localhost:5173/ sau khi thay Vite ready.
echo Tai khoan chu: xem data/first-login.txt sau lan khoi tao dau.
call npm run dev
pause