@echo off
echo ==========================================
echo ULTRON DEBUG BATCH FILE
echo ==========================================
echo.
echo This window will stay open no matter what happens.
echo.

:START
echo Current time: %TIME%
echo Current directory: %CD%
echo.

echo Testing basic commands...
echo.

echo 1. Testing directory change...
cd /d "C:\Users\JarettHall\Programming\Ultron"
echo Changed to: %CD%
echo.

echo 2. Checking if npm is available...
where npm
if %errorlevel% neq 0 (
    echo ERROR: npm not found in PATH!
) else (
    echo npm found successfully!
)
echo.

echo 3. Checking if node is available...
where node
if %errorlevel% neq 0 (
    echo ERROR: node not found in PATH!
) else (
    echo node found successfully!
)
echo.

echo 4. Listing current directory contents...
dir /b
echo.

echo 5. Checking for package.json...
if exist package.json (
    echo package.json EXISTS
) else (
    echo package.json NOT FOUND
)
echo.

echo ==========================================
echo DEBUG COMPLETE
echo ==========================================
echo.
echo Choose an option:
echo 1. Run again
echo 2. Try npm install
echo 3. Try npm run build
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto START
if "%choice%"=="2" goto INSTALL
if "%choice%"=="3" goto BUILD
if "%choice%"=="4" goto END

:INSTALL
echo.
echo Running npm install...
npm install
echo.
echo npm install completed with exit code: %errorlevel%
echo.
pause
goto START

:BUILD
echo.
echo Running npm run build...
npm run build
echo.
echo npm run build completed with exit code: %errorlevel%
echo.
pause
goto START

:END
echo.
echo Press any key to close...
pause >nul 