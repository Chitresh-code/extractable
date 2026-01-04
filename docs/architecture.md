# System Architecture

## Overview

Extractable is a SaaS platform for extracting structured tables from PDFs and images using Google's Gemini API. The system follows a 5-step validation pipeline to ensure accurate extraction.

## Architecture Diagram

```
┌─────────────┐
│   React     │
│  Frontend   │
└──────┬──────┘
       │ HTTP/JWT
       ▼
┌─────────────┐
│   FastAPI   │
│   Backend   │
└──────┬──────┘
       │
       ├──► PostgreSQL (Docker)
       │
       └──► Extraction Pipeline
              │
              ├──► Step 1: File Processing
              │     (PDF → Images)
              │
              ├──► Step 2: Table Extraction
              │     (Gemini API)
              │
              ├──► Step 3: Validation
              │     (Context-based)
              │
              ├──► Step 4: Finalization
              │     (Consolidated Output)
              │
              └──► Step 5: Storage
                    (Polars Conversion)
```

## Components

### Frontend

- **React 18+** with TypeScript
- **Vite** for build tooling
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

### Backend

- **FastAPI** web framework
- **PostgreSQL** database (Docker-based)
- **SQLAlchemy** ORM
- **Alembic** for migrations
- **JWT** authentication
- **Polars** for format conversion

### External Services

- **Google Gemini API** for table extraction

## Data Flow

### Extraction Pipeline

1. **File Processing**: Convert PDF to images or process image files
2. **Extraction**: Extract tables from each image using Gemini API
3. **Validation**: Validate extractions with context from adjacent images
4. **Finalization**: Generate consolidated output addressing validation issues
5. **Storage**: Convert to requested format (JSON/CSV/Excel) and store

### Authentication Flow

1. User registers/logs in
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. All API requests include token in Authorization header
5. Backend validates token and extracts user context

## Database Schema

### Users Table

- `id`: Primary key
- `email`: Unique email address
- `hashed_password`: Bcrypt hashed password
- `is_active`: Account status
- `is_verified`: Email verification status
- `created_at`, `updated_at`: Timestamps

### Extractions Table

- `id`: Primary key
- `user_id`: Foreign key to users
- `status`: pending | processing | completed | failed
- `input_type`: pdf | images
- `input_filename`: Original filename (reference only)
- `columns_requested`: JSON array of column names
- `multiple_tables`: Boolean flag
- `output_format`: json | csv | excel
- `output_file_path`: Path to stored output
- `llm_extraction_output`: JSON (full extraction responses)
- `llm_validation_output`: JSON (validation comments)
- `llm_final_output`: JSON (final generation response)
- `table_data`: JSON (final structured table)
- `created_at`, `updated_at`, `completed_at`: Timestamps

## Rate Limiting

Rate limits are tracked per user:
- **RPM**: Requests per minute
- **TPM**: Tokens per minute
- **RPD**: Requests per day

Implementation uses in-memory tracking with exponential backoff retry logic.

## Security

- JWT tokens for stateless authentication
- Bcrypt password hashing
- CORS configuration
- Input validation
- File type validation
- Rate limiting per user

## Storage

- **Input files**: NOT stored (processed in memory)
- **Output files**: Stored in `outputs/` directory
- **LLM responses**: Stored in database as JSON

## API Versioning

- URL path-based versioning: `/api/v1/`
- Supports multiple versions simultaneously
- Backward compatibility maintained

