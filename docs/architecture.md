# System Architecture

## Overview

Extractable is a production-grade SaaS platform for extracting structured tables from PDFs and images using OpenAI's GPT models. The system follows a multi-step validation pipeline to ensure accurate extraction, with a priority-based queue system for job management and real-time notifications.

## System Architecture Diagram

```mermaid
graph TB
    subgraph ClientLayer["Client Layer"]
        Browser["Web Browser"]
        Mobile["Mobile App"]
        APIClient["API Client"]
    end

    subgraph Frontend["Frontend - React Application"]
        React["React 18 + TypeScript"]
        Vite["Vite Build Tool"]
        UI["shadcn/ui Components"]
        Router["React Router"]
    end

    subgraph ReverseProxy["Reverse Proxy"]
        Nginx["Nginx"]
    end

    subgraph Backend["Backend - FastAPI Application"]
        FastAPI["FastAPI Server"]
        Auth["JWT Authentication"]
        APIRoutes["API Routes v1"]
        Middleware["CORS & Security"]
    end

    subgraph BusinessLogic["Business Logic Layer"]
        Queue["Queue Manager"]
        Pipeline["Extraction Pipeline"]
        EventMgr["Event Manager"]
        EmailSvc["Email Service"]
    end

    subgraph DataProcessing["Data Processing"]
        FileProc["File Processor"]
        Extractor["OpenAI Extractor"]
        Validator["Validator"]
        Finalizer["Finalizer"]
        Storage["Storage Service"]
    end

    subgraph DataLayer["Data Layer"]
        PostgreSQL["PostgreSQL Database"]
        FileStore["File Storage"]
    end

    subgraph ExternalServices["External Services"]
        OpenAI["OpenAI API"]
        Resend["Resend Email API"]
    end

    Browser --> Nginx
    Mobile --> Nginx
    APIClient --> Nginx
    Nginx --> React
    Nginx --> FastAPI

    React --> Router
    Router --> UI
    UI --> APIRoutes

    FastAPI --> Auth
    FastAPI --> Middleware
    FastAPI --> APIRoutes

    APIRoutes --> Queue
    APIRoutes --> EventMgr
    APIRoutes --> EmailSvc

    Queue --> Pipeline
    Pipeline --> FileProc
    Pipeline --> Extractor
    Pipeline --> Validator
    Pipeline --> Finalizer
    Pipeline --> Storage

    Extractor --> OpenAI
    EmailSvc --> Resend

    Pipeline --> PostgreSQL
    Storage --> PostgreSQL
    Storage --> FileStore
    Auth --> PostgreSQL
    APIRoutes --> PostgreSQL

    EventMgr -.-> Browser
```

## Component Architecture

```mermaid
graph LR
    subgraph FrontendComponents["Frontend Components"]
        A["Landing Page"]
        B["Login/Register"]
        C["Dashboard"]
        D["Extraction Form"]
        E["Extraction History"]
        F["Account Page"]
        G["Notification Center"]
    end

    subgraph BackendServices["Backend Services"]
        H["Auth Service"]
        I["Extraction Service"]
        J["User Service"]
        K["Queue Manager"]
        L["Event Manager"]
        M["Email Service"]
    end

    subgraph PipelineSteps["Pipeline Steps"]
        N["1. File Processing"]
        O["2. Extraction"]
        P["3. Validation"]
        Q["4. Finalization"]
        R["5. Storage"]
    end

    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G

    D --> I
    E --> I
    F --> J
    B --> H

    I --> K
    K --> N
    N --> O
    O --> P
    P --> Q
    Q --> R

    I --> L
    L --> G
```

## Data Flow - Extraction Pipeline

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Queue
    participant Pipeline
    participant OpenAI
    participant Database
    participant EventMgr

    User->>Frontend: Upload file + config
    Frontend->>API: POST /extractions
    API->>Database: Create extraction record
    API->>Queue: Enqueue job (priority)
    API->>EventMgr: Broadcast "Created" event
    API-->>Frontend: Return extraction ID
    Frontend-->>User: Show "Pending" status

    Queue->>Pipeline: Process next job
    Pipeline->>EventMgr: Broadcast "Started" event
    Pipeline->>Database: Update status = "processing"
    
    Pipeline->>Pipeline: Step 1: Process file
    Pipeline->>OpenAI: Extract tables
    OpenAI-->>Pipeline: Return extraction
    Pipeline->>Pipeline: Step 2: Validate
    Pipeline->>OpenAI: Finalize output
    OpenAI-->>Pipeline: Return final data
    Pipeline->>Database: Store results
    Pipeline->>EventMgr: Broadcast "Completed" event
    Pipeline->>Database: Update status = "completed"

    EventMgr-->>Frontend: SSE: Status update
    Frontend-->>User: Show "Completed" status
    User->>Frontend: Request download
    Frontend->>API: GET /extractions/{id}/download
    API-->>Frontend: Return file
```

## Queue Management System

```mermaid
stateDiagram
    [*] --> Pending
    Pending --> Queued
    Queued --> Processing
    Processing --> Completed
    Processing --> Failed
    Completed --> [*]
    Failed --> [*]
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    participant EmailSvc

    User->>Frontend: Register/Login
    Frontend->>API: POST /auth/register or /login
    API->>Database: Verify credentials
    Database-->>API: User data
    API->>API: Generate JWT token
    API->>EmailSvc: Send welcome email (if register)
    API-->>Frontend: Return token
    Frontend->>Frontend: Store token (localStorage)
    
    User->>Frontend: Access protected route
    Frontend->>API: Request with Authorization header
    API->>API: Validate JWT token
    API->>Database: Get user data
    API-->>Frontend: Return data
```

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ EXTRACTIONS : has
    USERS {
        int id PK
        string email UK
        string hashed_password
        string first_name
        string last_name
        bool is_active
        bool is_verified
        string password_reset_token
        datetime password_reset_expires
        datetime created_at
        datetime updated_at
    }
    
    EXTRACTIONS ||--o{ EXTRACTION_EVENTS : generates
    EXTRACTIONS {
        int id PK
        int user_id FK
        string status
        string input_type
        string input_filename
        json columns_requested
        bool multiple_tables
        string output_format
        string complexity
        string priority
        json llm_extraction_output
        json llm_validation_output
        json llm_final_output
        json table_data
        datetime created_at
        datetime updated_at
        datetime completed_at
    }
```

## Technology Stack

### Frontend

- **React 18+** with TypeScript - Modern UI framework
- **Vite** - Fast build tool and dev server
- **shadcn/ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Zustand** - State management
- **Sonner** - Toast notifications

### Backend

- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migration tool
- **Pydantic** - Data validation and settings
- **JWT** - Authentication tokens
- **Polars** - Fast data manipulation library
- **Uvicorn** - ASGI server

### External Services

- **OpenAI API** - GPT models for table extraction
- **Resend** - Transactional email service

### Infrastructure

- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and static file serving
- **Let's Encrypt** - SSL certificates

## Key Features

### 1. Priority-Based Queue System

- Per-user queues ensure only one extraction runs at a time
- Priority levels: High, Medium, Low
- Automatic queue processing with background tasks

### 2. Real-Time Notifications

- Server-Sent Events (SSE) for real-time updates
- Frontend polling fallback for status changes
- Toast notifications for user feedback

### 3. Multi-Step Extraction Pipeline

1. **File Processing**: Convert PDFs to images or process image files
2. **Extraction**: Extract tables using OpenAI GPT models
3. **Validation**: Validate extractions with context awareness
4. **Finalization**: Generate consolidated output addressing validation issues
5. **Storage**: Convert to requested format (JSON/CSV/Excel) and store

### 4. Email Integration

- Welcome emails on registration
- Password reset emails
- Configurable email addresses and reply-to

### 5. User Management

- JWT-based authentication
- User profiles with first/last name
- Password reset functionality
- Account management

## Security Features

- **JWT Authentication**: Stateless token-based auth
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Configuration**: Controlled cross-origin requests
- **Input Validation**: Pydantic schemas for request validation
- **Rate Limiting**: Per-user rate limits (RPM, TPM, RPD)
- **HTTPS**: SSL/TLS encryption in production
- **Security Headers**: XSS protection, frame options, etc.

## Storage Architecture

- **Input Files**: Processed in memory, not stored
- **Output Files**: Stored as JSON in database (table_data column)
- **LLM Responses**: Stored in database for audit trail
- **User Data**: Stored in PostgreSQL with proper indexing

## API Versioning

- URL path-based versioning: `/api/v1/`
- Supports multiple versions simultaneously
- Backward compatibility maintained
- Version detection endpoint: `/api/versions`

## Performance Considerations

- **Async Processing**: Background tasks for extraction jobs
- **Queue Management**: Prevents resource exhaustion
- **Database Indexing**: Optimized queries for user data
- **Caching**: Frontend asset caching via Nginx
- **Connection Pooling**: SQLAlchemy connection pool

## Scalability

- **Horizontal Scaling**: Stateless backend design
- **Database Scaling**: Can use managed PostgreSQL services
- **Load Balancing**: Nginx can distribute traffic
- **Background Jobs**: Queue system handles concurrent requests

## Monitoring & Observability

- **Health Checks**: `/health` endpoint for monitoring
- **Logging**: Structured logging throughout the application
- **Error Tracking**: Exception handling with detailed logs
- **Status Tracking**: Real-time extraction status updates

## Future Enhancements

See [TODO.md](../../TODO.md) for planned features including:

- Email notifications for extraction jobs
- Email verification
- Table editing capabilities
- Sharing and collaboration
- Vendor API for integrations
- Pricing tiers and gated services
