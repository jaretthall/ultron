@echo off
setlocal enabledelayedexpansion
echo Starting Ultron batch script...
echo Current directory: %CD%
echo.

echo Auto-detecting project directory...

REM Method 1: Use script location (most reliable)
set "SCRIPT_DIR=%~dp0"
set "AUTO_PROJECT_DIR=%SCRIPT_DIR%.."

REM Resolve the relative path to absolute path
for %%i in ("%AUTO_PROJECT_DIR%") do set "AUTO_PROJECT_DIR=%%~fi"

echo Script location method: %AUTO_PROJECT_DIR%

REM Check if this looks like the right directory
if exist "%AUTO_PROJECT_DIR%\package.json" (
    findstr /c:"ultron" "%AUTO_PROJECT_DIR%\package.json" >nul 2>&1
    if %errorlevel% equ 0 (
        set "PROJECT_DIR=%AUTO_PROJECT_DIR%"
        echo ✓ Auto-detected project directory: %PROJECT_DIR%
        goto :found_project_dir
    )
)

REM Method 2: Check current directory
echo Checking current directory...
if exist "package.json" (
    findstr /c:"ultron" "package.json" >nul 2>&1
    if %errorlevel% equ 0 (
        set "PROJECT_DIR=%CD%"
        echo ✓ Found project in current directory: %PROJECT_DIR%
        goto :found_project_dir
    )
)

REM Method 3: Check common development paths
echo Searching common development locations...
set "COMMON_PATHS=C:\Users\%USERNAME%\Programming\Ultron;C:\Projects\Ultron;C:\Development\Ultron;C:\Code\Ultron;%USERPROFILE%\Documents\Programming\Ultron;%USERPROFILE%\Desktop\Ultron"

for %%p in (%COMMON_PATHS%) do (
    if exist "%%p\package.json" (
        findstr /c:"ultron" "%%p\package.json" >nul 2>&1
        if %errorlevel% equ 0 (
            set "PROJECT_DIR=%%p"
            echo ✓ Found project at: %PROJECT_DIR%
            goto :found_project_dir
        )
    )
)

REM Method 4: Check environment variable
set "PROJECT_DIR=%ULTRON_PROJECT_DIR%"
if not "%PROJECT_DIR%"=="" (
    if exist "%PROJECT_DIR%\package.json" (
        echo ✓ Using environment variable: %PROJECT_DIR%
        goto :found_project_dir
    )
)

REM Method 5: Ask user for input
echo Could not auto-detect project directory.
echo Please enter the full path to your Ultron project directory:
set /p "PROJECT_DIR=Project Directory: "

if "%PROJECT_DIR%"=="" (
    echo ERROR: No project directory specified!
    echo.
    echo The script tried to find your Ultron project in:
    echo   1. Script location: %AUTO_PROJECT_DIR%
    echo   2. Current directory: %CD%
    echo   3. Common paths like: C:\Users\%USERNAME%\Programming\Ultron
    echo   4. Environment variable: ULTRON_PROJECT_DIR
    echo.
    echo Press any key to close...
    pause >nul
    goto :EOF
)

:found_project_dir
echo.
echo Using project directory: %PROJECT_DIR%
echo Changing to project directory...
cd /d "%PROJECT_DIR%"
if %errorlevel% neq 0 (
    echo ERROR: Could not change to project directory!
    echo Make sure the path exists: %PROJECT_DIR%
    echo.
    echo Press any key to close...
    pause >nul
    goto :EOF
)
echo Successfully changed to: %CD%
echo.

echo Checking if package.json exists...
if not exist package.json (
    echo ERROR: package.json not found in current directory!
    echo Make sure you're in the correct Ultron project folder.
    echo.
    echo Press any key to close...
    pause >nul
    goto :EOF
)
echo package.json found!
echo.

echo Step 1: Building application...
echo Running: npm run build
npm run build
set BUILD_ERROR=%errorlevel%
echo Build command finished with exit code: %BUILD_ERROR%

if %BUILD_ERROR% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Build failed with exit code %BUILD_ERROR%
    echo ========================================
    echo.
    echo Press any key to continue anyway or Ctrl+C to exit...
    pause >nul
    echo.
    echo Continuing despite build error...
)

echo.
echo Build completed!
echo.

echo Checking if dist folder exists...
if not exist dist (
    echo ERROR: dist folder not found! Build may have failed.
    echo.
    echo Press any key to close...
    pause >nul
    goto :EOF
)
echo dist folder found!
echo.

echo Detecting local IP address...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4 Address"') do set LOCAL_IP=%%i
set LOCAL_IP=%LOCAL_IP: =%
if "%LOCAL_IP%"=="" (
    echo Warning: Could not detect local IP address. Using localhost only.
    set LOCAL_IP=localhost
)
echo Local IP detected: %LOCAL_IP%
echo.

echo Step 2: Starting server on http://localhost:8080
echo Running: npx serve dist -p 8080
echo Press Ctrl+C to stop the server when it starts
echo.
npx serve dist -p 8080
set SERVE_ERROR=%errorlevel%
echo.
echo Server command finished with exit code: %SERVE_ERROR%
echo.
echo If the server is running, your app should now be available at:
echo http://localhost:8080
echo http://%LOCAL_IP%:8080 (for mobile access)
echo.

if %SERVE_ERROR% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Server failed with exit code %SERVE_ERROR%
    echo ========================================
)

echo.
echo Script completed.
echo Press any key to close this window...
pause >nul 