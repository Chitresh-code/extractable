# Deployment Guide

## Production Considerations

### Environment Variables

Ensure all production environment variables are set:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=<strong-random-secret-key>
GEMINI_API_KEY=<your-gemini-api-key>
CORS_ORIGINS=https://yourdomain.com
```

### Database

For production, use a managed PostgreSQL service:
- AWS RDS
- Google Cloud SQL
- Azure Database
- DigitalOcean Managed Databases

Update `DATABASE_URL` accordingly.

### File Storage

For production, consider:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

Update storage service to use object storage instead of local filesystem.

### Rate Limiting

For production at scale, consider:
- Redis for distributed rate limiting
- Separate rate limits per subscription tier
- Background job queue (Celery, RQ, etc.)

### Security

- Use HTTPS only
- Set strong `SECRET_KEY`
- Configure CORS properly
- Enable rate limiting
- Use environment variables for secrets
- Regular security updates

### Monitoring

- Application logs
- Error tracking (Sentry)
- Performance monitoring
- Database monitoring
- API usage analytics

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"

volumes:
  postgres_data:
```

## Cloud Deployment Options

### AWS

- **Backend**: ECS, EKS, or Elastic Beanstalk
- **Frontend**: S3 + CloudFront
- **Database**: RDS PostgreSQL
- **Storage**: S3

### Google Cloud

- **Backend**: Cloud Run or GKE
- **Frontend**: Cloud Storage + Cloud CDN
- **Database**: Cloud SQL
- **Storage**: Cloud Storage

### Azure

- **Backend**: App Service or AKS
- **Frontend**: Static Web Apps
- **Database**: Azure Database for PostgreSQL
- **Storage**: Blob Storage

## Scaling

### Horizontal Scaling

- Multiple backend instances behind load balancer
- Stateless backend design (JWT tokens)
- Shared database and storage

### Vertical Scaling

- Increase database resources
- Increase backend instance size
- Optimize queries and indexes

### Caching

- Redis for rate limiting
- CDN for static assets
- Database query caching

## Backup Strategy

- Regular database backups
- Automated backup retention
- Test restore procedures
- Backup verification

## Health Checks

- `/health` endpoint for load balancer
- Database connection checks
- External service checks (Gemini API)

