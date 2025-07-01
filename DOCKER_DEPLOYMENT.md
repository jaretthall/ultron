# Ultron Docker Deployment Guide

## 🚀 Quick Start (Standalone)

Your Ultron app can be deployed as a standalone Docker container in multiple ways:

### Option 1: PowerShell Script (Windows - Recommended)
```powershell
# Run the deployment script
.\deploy-standalone.ps1

# Or with custom port
.\deploy-standalone.ps1 -Port 3000
```

### Option 2: Bash Script (Linux/Mac)
```bash
# Make script executable
chmod +x deploy-standalone.sh

# Run deployment
./deploy-standalone.sh

# Or with custom port
PORT=3000 ./deploy-standalone.sh
```

### Option 3: Manual Docker Commands
```bash
# Build the image
docker build -t ultron-app .

# Run the container
docker run -d --name ultron-standalone -p 8080:80 ultron-app
```

### Option 4: Docker Compose (Simplified)
```bash
# Using the standalone compose file
docker-compose -f docker-compose.standalone.yml up -d
```

## 🌐 Access Your App

After deployment, your Ultron app will be available at:
- **http://localhost:8080** (default)
- **http://localhost:[YOUR_PORT]** (if you changed the port)

## 📊 Features Included

Your containerized Ultron includes:

✅ **Production-Ready Features:**
- Multi-stage Docker build (optimized size)
- Nginx web server with security headers
- Health checks and auto-restart
- Gzip compression and caching
- Security hardening (non-root user)

✅ **Application Features:**
- Full Ultron productivity dashboard
- AI-powered insights and planning
- Project and task management
- Calendar integration
- Analytics and export system
- Document management
- Real-time synchronization with Supabase

## 🔧 Configuration

### Database Connection
Your app is pre-configured to connect to your Supabase database. The connection details are already set in the code.

### AI Services
The app includes support for multiple AI providers:
- **Google Gemini** (Primary)
- **OpenAI** (Alternative)  
- **Claude** (Alternative)

AI keys can be configured through the app's settings page.

## 📈 Monitoring Options

### Basic Health Check
```bash
# Check if container is healthy
docker inspect ultron-standalone --format='{{.State.Health.Status}}'
```

### View Logs
```bash
# View application logs
docker logs ultron-standalone

# Follow logs in real-time
docker logs -f ultron-standalone
```

### Advanced Monitoring (Optional)
For production monitoring, use the full docker-compose setup:
```bash
# Deploy with monitoring stack
docker-compose --profile monitoring up -d
```

This includes:
- **Prometheus** (metrics) - http://localhost:9090
- **Grafana** (dashboards) - http://localhost:3000

## 🛠️ Management Commands

```bash
# Start the container
docker start ultron-standalone

# Stop the container  
docker stop ultron-standalone

# Restart the container
docker restart ultron-standalone

# Remove the container
docker rm ultron-standalone

# View container status
docker ps | grep ultron

# Update to latest version
docker build -t ultron-app . && docker restart ultron-standalone
```

## 🔒 Security Features

Your containerized app includes:

- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Non-root User**: Container runs as nginx user
- **Rate Limiting**: API and login endpoint protection
- **Content Security Policy**: XSS protection
- **Health Checks**: Automatic failure detection

## 🚀 Production Deployment

For production environments:

1. **Use HTTPS**: Configure SSL certificates
2. **Environment Variables**: Set production database URLs
3. **Backup Strategy**: Configure Supabase backups
4. **Monitoring**: Enable Prometheus/Grafana stack
5. **Updates**: Implement CI/CD pipeline

### Production Docker Compose
```bash
# Full production stack
docker-compose --profile production up -d
```

## 📱 Mobile Access

Your containerized Ultron is fully responsive and works on:
- ✅ Desktop browsers
- ✅ Mobile browsers  
- ✅ Tablet interfaces
- ✅ Touch devices

## 🆘 Troubleshooting

### Container Won't Start
```bash
# Check Docker logs
docker logs ultron-standalone

# Verify Docker is running
docker info
```

### Port Already in Use
```bash
# Use different port
docker run -d --name ultron-standalone -p 9090:80 ultron-app
```

### Database Connection Issues
- Verify internet connection (Supabase is cloud-hosted)
- Check Supabase service status
- Review app logs for connection errors

### Performance Issues
```bash
# Check resource usage
docker stats ultron-standalone

# Allocate more resources if needed
docker run -d --name ultron-standalone -p 8080:80 --memory=1g --cpus=2 ultron-app
```

## 📞 Support

For issues or questions:
1. Check the container logs: `docker logs ultron-standalone`
2. Verify the health status: `docker inspect ultron-standalone`
3. Review this documentation
4. Check the main README.md for application-specific help

---

**Version:** 2.5.20  
**Last Updated:** January 2025  
**Docker Status:** ✅ Production Ready 