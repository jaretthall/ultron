#!/bin/bash
# Ultron Standalone Deployment Script
# Version 2.5.20

set -e

echo "🚀 Ultron Standalone Deployment"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Configuration
CONTAINER_NAME="ultron-standalone"
IMAGE_NAME="ultron-app"
PORT=${PORT:-8080}

echo "📦 Building Ultron Docker image..."
docker build -t $IMAGE_NAME . || {
    echo "❌ Build failed"
    exit 1
}

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🔄 Stopping existing container..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

echo "🚀 Starting Ultron standalone container..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:80 \
    --restart unless-stopped \
    --health-cmd="curl -f http://localhost:80/ || exit 1" \
    --health-interval=30s \
    --health-timeout=10s \
    --health-retries=3 \
    --health-start-period=40s \
    $IMAGE_NAME

# Wait for container to be healthy
echo "⏳ Waiting for application to start..."
sleep 10

# Check if container is running
if docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ Ultron is running!"
    echo ""
    echo "🌐 Access your application at:"
    echo "   http://localhost:$PORT"
    echo ""
    echo "📊 Container status:"
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:    docker logs $CONTAINER_NAME"
    echo "   Stop app:     docker stop $CONTAINER_NAME"
    echo "   Remove app:   docker rm $CONTAINER_NAME"
    echo "   Health check: docker inspect $CONTAINER_NAME --format='{{.State.Health.Status}}'"
else
    echo "❌ Failed to start container"
    echo "📝 Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi 