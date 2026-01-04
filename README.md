# Extractable

A production-grade SaaS platform for extracting structured tables from PDFs and images using OpenAI's GPT models.

## Features

- Extract tables from PDFs and images with proper structure
- Smart column detection (user-specified or auto-detect)
- Support for multiple tables in input files
- Multi-pass validation pipeline for accuracy
- Graceful rate limit handling
- JWT-based user authentication
- API versioning support
- React frontend with shadcn/ui

## Tech Stack

**Backend:**
- FastAPI with Python
- PostgreSQL (Docker-based)
- OpenAI API (GPT-5 series)
- Polars for format conversion

**Frontend:**
- React 18+ with TypeScript
- Vite
- shadcn/ui
- Tailwind CSS

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)

### Docker Setup (Recommended)

1. Set up environment variables in `backend/.env`:
```bash
# Required: OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Model configuration (defaults shown)
OPENAI_SIMPLE_MODEL=gpt-5-nano
OPENAI_REGULAR_MODEL=gpt-5-mini
OPENAI_COMPLEX_MODEL=gpt-5

# Required: Database and JWT settings
POSTGRES_USER=extractable_user
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=extractable_db
POSTGRES_HOST=postgres
SECRET_KEY=your-secret-key-change-in-production
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

4. Run database migrations (first time only):
```bash
docker-compose exec backend alembic upgrade head
```

### Local Development Setup

#### Backend Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `backend/.env`:
```bash
# Add your OPENAI_API_KEY and other settings (see above)
```

4. Start PostgreSQL:
```bash
docker-compose up -d postgres
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

## Documentation

See the [docs/](docs/) directory for detailed documentation:
- [API Documentation](docs/api.md)
- [Architecture](docs/architecture.md)
- [Development Guide](docs/development.md)
- [Deployment Guide](docs/deployment.md)

## License

MIT
