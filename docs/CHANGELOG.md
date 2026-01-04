# Changelog

All notable changes to the Extractable project will be documented in this file.

## [1.0.0] - 2024-01-01

### Added

- Initial release of Extractable SaaS platform
- 5-step validation pipeline for table extraction
- JWT-based user authentication
- PostgreSQL database with Docker support
- React frontend with shadcn/ui and Tailwind CSS
- API versioning support (v1)
- Rate limiting with exponential backoff
- Support for PDF and image file inputs
- Multiple output formats (JSON, CSV, Excel)
- Polars-based format conversion
- Comprehensive documentation

### Features

- User registration and login
- File upload (PDF or images)
- Table extraction with Gemini API
- Multi-pass validation
- Extraction history
- Download results in multiple formats

### Technical Stack

- Backend: FastAPI, PostgreSQL, SQLAlchemy, Alembic
- Frontend: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- External: Google Gemini API
- Format Conversion: Polars

