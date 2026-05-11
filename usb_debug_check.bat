@echo off
rem -------------------------------------------------
rem Simple USB‑debugging verification script
rem -------------------------------------------------
set "ADB_PATH=%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools"

rem Add ADB to PATH for this session
set "PATH=%PATH%;%ADB_PATH%"

rem 1️⃣ Verify a device is connected
adb devices
if %errorlevel% neq 0 (
    echo [ERROR] ADB not found or failed. Check that Android SDK platform‑tools are installed.
    goto :eof
)

rem Check that at least one device appears
for /f "skip=1 tokens=1" %%A in ('adb devices ^| findstr /r /v "^$"') do set "DEVICE=%%A"
if "%DEVICE%"=="" (
    echo [ERROR] No USB‑debugging device detected. Ensure USB debugging is enabled and the phone authorized this PC.
    goto :eof
) else (
    echo [INFO] Device %DEVICE% detected.
)

rem 2️⃣ Create the reverse tunnel (phone localhost -> PC port 3000)
adb reverse tcp:3000 tcp:3000
if %errorlevel% neq 0 (
    echo [ERROR] adb reverse failed. Make sure the device is still connected.
    goto :eof
) else (
    echo [INFO] Reverse tunnel created (phone localhost:3000 -> PC).
)

rem 3️⃣ Verify the /ping endpoint (requires the Node server to be running)
rem You can start the server in another terminal with "npm run dev".

rem Use PowerShell to request the endpoint (since Windows curl may be unavailable)
powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:3000/ping -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '[SUCCESS] /ping returned OK' } else { Write-Host '[FAIL] Unexpected status code: ' $r.StatusCode } } catch { Write-Host '[FAIL] Could not reach /ping – check that the server is running and the reverse tunnel is active.' }"

rem 4️⃣ Optionally open the controller page on the phone automatically
rem (requires the device to have Chrome installed)
adb shell am start -a android.intent.action.VIEW -d "http://localhost:3000/controller.html"

pause
