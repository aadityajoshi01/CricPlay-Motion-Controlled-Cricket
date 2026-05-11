@echo off
setlocal
echo Starting Cric Motion Game Server...
npm run dev
rem Wait a moment for the server to start
timeout /t 3 >nul
adb reverse tcp:3000 tcp:3000
if %errorlevel% neq 0 (
    echo Failed to forward port via ADB. Check your device connection.
) else (
    echo Port 3000 successfully forwarded to your Android device.
    echo Open http://localhost:3000/controller.html on your phone.
)
pause
