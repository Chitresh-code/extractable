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

- Set up environment variables in `backend/.env`:

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

- Start all services:

```bash
docker-compose up -d
```

- Access the application:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API Docs: <http://localhost:8000/docs>

- Run database migrations (first time only):

```bash
docker-compose exec backend alembic upgrade head
```

### Local Development Setup

#### Backend Setup

- Create virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

- Install dependencies:

```bash
pip install -r requirements.txt
```

- Set up environment variables in `backend/.env`:

```bash
# Add your OPENAI_API_KEY and other settings (see above)
```

- Start PostgreSQL:

```bash
docker-compose up -d postgres
```

- Run database migrations:

```bash
alembic upgrade head
```

- Start the server:

```bash
uvicorn app.main:app --reload
```

### Frontend Setup

- Install dependencies:

```bash
cd frontend
npm install
```

- Start development server:

```bash
npm run dev
```

## Documentation

📚 **Start here**: [Documentation Index](docs/README.md) - Complete guide to all documentation

### Core Documentation

- **[Architecture](docs/architecture.md)** - System architecture, component diagrams, and technical overview
- **[API Documentation](docs/api.md)** - Complete API reference with examples and code snippets
- **[Development Guide](docs/development.md)** - Setup, development workflow, and best practices
- **[Deployment Guide](docs/deployment.md)** - Production deployment instructions for `extractable.in` and `api.extractable.in`
- **[API Versioning](docs/api-versioning.md)** - API versioning strategy and migration guides
- **[Changelog](docs/CHANGELOG.md)** - Version history and release notes

### Quick Links

- 🚀 **Getting Started**: [Development Guide](docs/development.md#quick-start)
- 🏗️ **Understanding the System**: [Architecture](docs/architecture.md)
- 🔌 **API Integration**: [API Documentation](docs/api.md)
- 🚢 **Deploying to Production**: [Deployment Guide](docs/deployment.md)
- 📋 **Feature Roadmap**: [TODO.md](TODO.md)

## License

MIT
