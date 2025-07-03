@echo off
echo 🚀 Ultron Simple Deployment
echo =============================

REM Add Docker to PATH
set PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin

echo 📦 Building Ultron Docker image...
docker build -t ultron-app .

if errorlevel 1 (
    echo ❌ Build failed. Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo 🔄 Stopping any existing container...
docker stop ultron-standalone 2>nul
docker rm ultron-standalone 2>nul

echo 🚀 Starting Ultron container...
docker run -d --name ultron-standalone -p 8080:80 --restart unless-stopped ultron-app

if errorlevel 1 (
    echo ❌ Failed to start container
    pause
    exit /b 1
)

echo ✅ Ultron is running!
echo 🌐 Access your app at: http://localhost:8080
echo.
echo 📝 Useful commands:
echo    View logs:  docker logs ultron-standalone
echo    Stop app:   docker stop ultron-standalone
echo.
pause 