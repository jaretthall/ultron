@echo off
echo Starting Ultron batch script...
echo Current directory: %CD%
echo.

echo Changing to project directory...
cd /d "C:\Users\JarettHall\Programming\Ultron"
if %errorlevel% neq 0 (
    echo ERROR: Could not change to project directory!
    echo Make sure the path exists: C:\Users\JarettHall\Programming\Ultron
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
echo http://192.168.1.17:8080 (for mobile access)
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