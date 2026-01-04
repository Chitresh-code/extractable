# Deployment Guide

## Overview

This guide covers deploying Extractable to production with:

- Frontend at `extractable.in`
- API at `api.extractable.in`
- SSL/TLS encryption
- Production-ready configuration

## Deployment Architecture

```mermaid
graph TB
    subgraph DNS["DNS"]
        DNSRecords["DNS Records"]
    end

    subgraph Server["Server"]
        Nginx["Nginx with SSL"]
        Frontend["Frontend Container"]
        Backend["Backend Container"]
        Postgres["PostgreSQL Container"]
    end

    subgraph External["External Services"]
        OpenAI["OpenAI API"]
        Resend["Resend Email"]
    end

    DNSRecords -->|A Record| Nginx
    DNSRecords -->|A Record api| Nginx
    
    Nginx -->|HTTPS| Frontend
    Nginx -->|HTTPS| Backend
    
    Frontend -->|Static Files| Nginx
    Backend -->|HTTP| Nginx
    Backend --> Postgres
    Backend --> OpenAI
    Backend --> Resend
```

## Prerequisites

- Ubuntu 20.04+ or similar Linux server
- Domain name (extractable.in) with DNS access
- Docker and Docker Compose installed
- Nginx installed
- Certbot for SSL certificates
- Basic knowledge of Linux server administration

## Step 1: DNS Configuration

Configure your DNS records to point to your server:

```text
Type    Name    Value              TTL
A       @       <your-server-ip>   3600
A       api     <your-server-ip>   3600
CNAME   www     extractable.in     3600
```

Allow 24-48 hours for DNS propagation.

## Step 2: Server Setup

### Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Step 3: Environment Configuration

### Backend Environment Variables

Create `backend/.env`:

```bash
# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_USER=extractable_user
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=extractable_db

# Or use managed database
# DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT Configuration
SECRET_KEY=<generate-strong-secret-key>
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI Configuration
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_SIMPLE_MODEL=gpt-5-nano
OPENAI_REGULAR_MODEL=gpt-5-mini
OPENAI_COMPLEX_MODEL=gpt-5

# CORS Configuration
CORS_ORIGINS=https://extractable.in,https://www.extractable.in

# Frontend URL (for password reset links)
FRONTEND_URL=https://extractable.in

# Email Configuration (Resend)
RESEND_API_KEY=<your-resend-api-key>
RESEND_DEFAULT_FROM_EMAIL=Extractable <no-reply@extractable.in>
RESEND_FOUNDER_EMAIL=Chitresh Gyanani <chitresh.gyanani@extractable.in>
RESEND_REPLY_TO=support@extractable.in

# Rate Limiting
RATE_LIMIT_RPM=60
RATE_LIMIT_TPM=32000
RATE_LIMIT_RPD=1500
MAX_RETRIES=3

# File Upload
MAX_UPLOAD_SIZE=10485760  # 10MB
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```bash
VITE_API_BASE_URL=https://api.extractable.in/api/v1
```

## Step 4: Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: extractable_postgres_prod
    env_file:
      - ./backend/.env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - extractable_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-extractable_user} -d ${POSTGRES_DB:-extractable_db}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: extractable_backend_prod
    env_file:
      - ./backend/.env
    environment:
      POSTGRES_HOST: postgres
    networks:
      - extractable_network
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    expose:
      - "8000"
    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: https://api.extractable.in/api/v1
    container_name: extractable_frontend_prod
    env_file:
      - ./frontend/.env.local
    networks:
      - extractable_network
    restart: unless-stopped
    volumes:
      - frontend_build:/usr/share/nginx/html
    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
  frontend_build:

networks:
  extractable_network:
    driver: bridge
```

## Step 5: Nginx Configuration

### Create Nginx Configuration

Create `/etc/nginx/sites-available/extractable`:

```nginx
# Frontend - extractable.in
server {
    listen 80;
    server_name extractable.in www.extractable.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name extractable.in www.extractable.in;
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/extractable.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/extractable.in/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend static files
    root /var/www/extractable/frontend;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss application/json 
               application/javascript application/wasm;
    
    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Don't cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}

# API - api.extractable.in
server {
    listen 80;
    server_name api.extractable.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.extractable.in;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.extractable.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.extractable.in/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to backend
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }
    
    # API documentation
    location /docs {
        proxy_pass http://localhost:8000/docs;
    }
    
    location /openapi.json {
        proxy_pass http://localhost:8000/openapi.json;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/extractable /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: SSL Certificates

### Get SSL Certificates

```bash
# Frontend domain
sudo certbot --nginx -d extractable.in -d www.extractable.in

# API subdomain
sudo certbot --nginx -d api.extractable.in

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot automatically configures Nginx and sets up auto-renewal.

## Step 7: Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Extractable..."

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🔄 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Copy frontend build to Nginx directory
echo "📂 Copying frontend build..."
sudo mkdir -p /var/www/extractable/frontend
sudo docker cp extractable_frontend_prod:/usr/share/nginx/html/. /var/www/extractable/frontend/
sudo chown -R www-data:www-data /var/www/extractable/frontend

# Run migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# Health check
echo "🏥 Checking health..."
sleep 5
curl -f https://api.extractable.in/health || echo "⚠️ Health check failed"

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://extractable.in"
echo "🔌 API: https://api.extractable.in"
```

Make it executable:

```bash
chmod +x deploy.sh
```

## Step 8: Initial Deployment

```bash
# Clone repository (if not already done)
git clone <your-repo-url> extractable
cd extractable

# Switch to production branch
git checkout main  # or your production branch

# Set up environment variables
# Edit backend/.env and frontend/.env.local

# Run deployment
./deploy.sh
```

## Step 9: Post-Deployment Verification

### Check Services

```bash
# Check Docker containers
docker-compose -f docker-compose.prod.yml ps

# Check Nginx
sudo systemctl status nginx

# Check SSL certificates
sudo certbot certificates

# Test endpoints
curl https://extractable.in
curl https://api.extractable.in/health
curl https://api.extractable.in/api/versions
```

### Check Logs

```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Frontend logs
docker-compose -f docker-compose.prod.yml logs -f frontend

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Updating the Application

### Update Script

Create `update.sh`:

```bash
#!/bin/bash
set -e

echo "🔄 Updating Extractable..."

# Pull latest code
git pull origin main  # or your production branch

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Copy frontend build
sudo docker cp extractable_frontend_prod:/usr/share/nginx/html/. /var/www/extractable/frontend/
sudo chown -R www-data:www-data /var/www/extractable/frontend

# Run migrations
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Update complete!"
```

## Monitoring & Maintenance

### Health Checks

Set up monitoring for:

- `https://api.extractable.in/health`
- `https://api.extractable.in/api/versions`
- Database connectivity
- Disk space
- Memory usage

### Backup Strategy

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups/extractable"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U extractable_user extractable_db > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

Add to crontab:

```bash
0 2 * * * /path/to/backup.sh
```

### Log Rotation

Docker handles log rotation via `docker-compose.prod.yml` logging configuration.

For Nginx:

```bash
# /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

## Troubleshooting

### Common Issues

#### 1. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

#### 2. Database Connection Issues

```bash
# Check database container
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U extractable_user -d extractable_db
```

#### 3. Frontend Not Loading

```bash
# Check frontend container
docker-compose -f docker-compose.prod.yml ps frontend

# Check Nginx configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/extractable/frontend
```

#### 4. API Not Responding

```bash
# Check backend container
docker-compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Test API directly
curl http://localhost:8000/health
```

## Security Checklist

- [ ] Strong `SECRET_KEY` generated
- [ ] Strong database password
- [ ] Firewall configured (UFW)
- [ ] SSL certificates installed and auto-renewing
- [ ] Security headers configured in Nginx
- [ ] Environment variables secured (not in git)
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Rate limiting configured
- [ ] CORS properly configured

## Scaling Considerations

### Horizontal Scaling

For multiple backend instances:

1. Use a load balancer (Nginx upstream or cloud load balancer)
2. Ensure backend is stateless (JWT tokens)
3. Use shared database
4. Consider Redis for shared rate limiting

### Database Scaling

- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Configure connection pooling
- Add read replicas for read-heavy workloads
- Regular backups and monitoring

### CDN for Frontend

- Use CloudFlare or similar CDN
- Cache static assets
- Reduce server load

## Cloud Deployment Options

### AWS

- **Backend**: ECS, EKS, or Elastic Beanstalk
- **Frontend**: S3 + CloudFront
- **Database**: RDS PostgreSQL
- **Load Balancer**: Application Load Balancer

### Google Cloud

- **Backend**: Cloud Run or GKE
- **Frontend**: Cloud Storage + Cloud CDN
- **Database**: Cloud SQL
- **Load Balancer**: Cloud Load Balancing

### DigitalOcean

- **App Platform**: Managed containers
- **Droplets**: VPS with Docker
- **Managed Databases**: PostgreSQL
- **Spaces**: Object storage for frontend

## Support & Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## TODO: Future Enhancements

See [TODO.md](../../TODO.md) for planned deployment improvements:

- [ ] Kubernetes deployment configuration
- [ ] CI/CD pipeline for automated deployments
- [ ] Monitoring and alerting setup (Prometheus, Grafana)
- [ ] Automated backup and restore procedures
- [ ] Multi-region deployment support
- [ ] Blue-green deployment strategy
