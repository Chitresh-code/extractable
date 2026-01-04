# Development Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL client tools (optional)

## Local Setup

### 1. Clone and Setup Environment

```bash
cd extractable
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Start PostgreSQL

```bash
docker-compose up -d postgres
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Database Migrations

```bash
# Create initial migration (if not exists)
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 5. Run Backend

```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### 6. Frontend Setup

```bash
cd frontend
npm install
```

### 7. Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Follow the prompts and select:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

### 8. Install shadcn/ui Components

```bash
npx shadcn@latest add button input card table checkbox select
```

### 9. Run Frontend

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Project Structure

```
extractable/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Configuration
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   ├── pipeline/     # Extraction pipeline
│   │   └── utils/        # Utilities
│   └── alembic/          # Migrations
├── frontend/
│   └── src/
│       ├── components/   # React components
│       ├── services/     # API clients
│       ├── context/      # React context
│       └── types/        # TypeScript types
└── docs/                 # Documentation
```

## Running Tests

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Code Style

### Backend

- Follow PEP 8
- Use type hints
- Add docstrings
- Use Black for formatting (optional)

### Frontend

- Follow ESLint rules
- Use TypeScript strict mode
- Use Prettier for formatting (optional)

## Database Migrations

### Create Migration

```bash
cd backend
alembic revision --autogenerate -m "Description"
```

### Apply Migration

```bash
alembic upgrade head
```

### Rollback Migration

```bash
alembic downgrade -1
```

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `GEMINI_API_KEY`: Google Gemini API key
- Rate limiting settings
- CORS origins

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running: `docker-compose ps`
2. Check connection string in `.env`
3. Verify database exists: `docker-compose exec postgres psql -U extractable_user -d extractable_db`

### Rate Limiting Issues

- Check rate limit settings in `.env`
- Monitor rate limit logs
- Adjust limits if needed

### Frontend Build Issues

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Check Node.js version: `node --version`

## Contributing

1. Create a feature branch
2. Make changes
3. Write/update tests
4. Update documentation
5. Submit pull request

