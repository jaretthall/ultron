# Ultron Standalone Deployment Script (PowerShell)
# Version 2.7.2

param(
    [int]$Port = 8080
)

Write-Host "🚀 Ultron Standalone Deployment" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Docker not running" }
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Configuration
$ContainerName = "ultron-standalone"
$ImageName = "ultron-app"

Write-Host "📦 Building Ultron Docker image..." -ForegroundColor Yellow
try {
    docker build -t $ImageName .
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
} catch {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Stop and remove existing container if it exists
$existingContainer = docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
if ($existingContainer) {
    Write-Host "🔄 Stopping existing container..." -ForegroundColor Yellow
    docker stop $ContainerName | Out-Null
    docker rm $ContainerName | Out-Null
}

Write-Host "🚀 Starting Ultron standalone container..." -ForegroundColor Green
docker run -d --name $ContainerName -p "${Port}:80" --restart unless-stopped $ImageName

# Wait for container to start
Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if container is running
$runningContainer = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
if ($runningContainer) {
    Write-Host "✅ Ultron is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access your application at:" -ForegroundColor Cyan
    Write-Host "   http://localhost:$Port" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Container status:" -ForegroundColor Cyan
    docker ps --filter "name=$ContainerName" --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
    Write-Host ""
    Write-Host "📝 Useful commands:" -ForegroundColor Cyan
    Write-Host "   View logs:    docker logs $ContainerName" -ForegroundColor White
    Write-Host "   Stop app:     docker stop $ContainerName" -ForegroundColor White
    Write-Host "   Remove app:   docker rm $ContainerName" -ForegroundColor White
} else {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    Write-Host "📝 Check logs with: docker logs $ContainerName" -ForegroundColor Yellow
    exit 1
} 