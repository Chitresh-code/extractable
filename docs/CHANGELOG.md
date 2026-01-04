# Changelog

All notable changes to the Extractable project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Email notifications for extraction jobs
- Email verification before starting jobs
- Table editing capabilities
- Sharing and collaboration features
- Vendor API for integrations
- Pricing tiers and gated services

See [TODO.md](../../TODO.md) for complete feature roadmap.

## [1.1.0] - 2024-01-04

### Added in 1.1.0

- Priority-based queue system for extraction jobs
  - High, medium, and low priority levels
  - Per-user queue management
  - Only one extraction runs per user at a time
- Real-time notifications via Server-Sent Events (SSE)
  - Status updates streamed to frontend
  - Notification center in dashboard
  - Toast notifications for user feedback
- User profile management
  - First name and last name fields
  - Account page accessible from sidebar
  - Profile update functionality
- Email functionality
  - Welcome emails on registration via Resend
  - Password reset emails
  - Configurable email addresses (from, reply-to)
  - Support contact information in frontend
- Password reset functionality
  - Forgot password endpoint
  - Reset password with token
  - Email-based token delivery
- Excel download support
  - Added xlsxwriter dependency
  - Excel format export for extractions
- Enhanced extraction form
  - Priority selection dropdown
  - Better error handling
  - Form closes on successful submission

### Changed in 1.1.0

- Updated extraction API to support priority parameter
- Modified queue manager to handle priority-based ordering
- Enhanced event manager for real-time updates
- Improved frontend notification system with polling fallback
- Updated database schema with user name fields and password reset fields
- Changed datetime handling to timezone-aware throughout application

### Fixed in 1.1.0

- Fixed "Cannot update extraction while processing" error
  - Now allows input_filename updates during processing
- Fixed form not closing after submission
- Fixed Excel download missing dependency
- Fixed repeated API requests in notification hook
- Fixed TypeScript errors in useGlobalNotifications
- Fixed datetime comparison errors (timezone-aware vs naive)
- Fixed Resend API integration (module-level API usage)

### Security in 1.1.0

- Improved password reset token security
- Timezone-aware datetime comparisons
- Enhanced email security headers

## [1.0.0] - 2024-01-01

### Added

- Initial release of Extractable SaaS platform
- 5-step validation pipeline for table extraction
  1. File Processing (PDF to images)
  2. Table Extraction (OpenAI GPT models)
  3. Validation (Context-based)
  4. Finalization (Consolidated output)
  5. Storage (Format conversion)
- JWT-based user authentication
  - User registration
  - Login with JWT tokens
  - Token refresh
  - Protected routes
- PostgreSQL database with Docker support
  - SQLAlchemy ORM
  - Alembic migrations
  - User and extraction models
- React frontend with shadcn/ui and Tailwind CSS
  - Modern, responsive UI
  - Dashboard for managing extractions
  - Extraction form with file upload
  - Extraction history and details
  - Landing page
- API versioning support (v1)
  - URL path-based versioning
  - Version detection endpoint
  - Backward compatibility
- Rate limiting with exponential backoff
  - Requests per minute (RPM): 60
  - Tokens per minute (TPM): 32,000
  - Requests per day (RPD): 1,500
- Support for PDF and image file inputs
  - PDF processing with image conversion
  - Multiple image file support
  - File validation
- Multiple output formats
  - JSON (default, stored in database)
  - CSV (on-demand conversion)
  - Excel (on-demand conversion)
- Polars-based format conversion
  - Efficient data manipulation
  - Fast format conversion
- Comprehensive documentation
  - Architecture documentation
  - API documentation
  - Development guide
  - Deployment guide

### Features

- User registration and login
- File upload (PDF or images)
- Table extraction with OpenAI GPT models
- Multi-pass validation pipeline
- Extraction history with pagination
- Download results in multiple formats
- Column specification (optional)
- Multiple tables support
- Complexity levels (simple, regular, complex)

### Technical Stack

- Backend: FastAPI, PostgreSQL, SQLAlchemy, Alembic
- Frontend: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- External: OpenAI API (GPT-5 series)
- Format Conversion: Polars
- Containerization: Docker & Docker Compose
- Reverse Proxy: Nginx (production)

### Infrastructure

- Docker Compose for development
- Production-ready Dockerfiles
- Nginx configuration for production
- SSL/TLS support with Let's Encrypt
- Health check endpoints

## Version History

- **1.1.0** - Queue system, notifications, user profiles, email functionality
- **1.0.0** - Initial release with core extraction functionality

## Migration Notes

### Upgrading from 1.0.0 to 1.1.0

1. **Database Migrations**: Run all pending migrations

   ```bash
   alembic upgrade head
   ```

2. **Environment Variables**: Add new required variables
   - `RESEND_API_KEY`
   - `RESEND_DEFAULT_FROM_EMAIL`
   - `RESEND_FOUNDER_EMAIL`
   - `RESEND_REPLY_TO`
   - `FRONTEND_URL`

3. **Dependencies**: Update Python dependencies

   ```bash
   pip install -r requirements.txt
   ```

   New dependencies: `resend>=2.0.0`, `xlsxwriter>=3.1.0`

4. **Frontend**: Update frontend dependencies

   ```bash
   npm install
   ```

5. **Configuration**: Update CORS origins to include production domain

## Breaking Changes

None in version 1.1.0 - all changes are backward compatible.

## Deprecations

None currently.

## Security Advisories

- Always use strong `SECRET_KEY` in production
- Keep dependencies up to date
- Use HTTPS in production
- Regularly rotate API keys
- Monitor for security updates

## Known Issues

- See [TODO.md](../../TODO.md) for known issues and planned fixes

## Contributors

- Initial development and core features
- Queue system and notifications
- Email functionality
- User profile enhancements

---

For detailed information about specific features, see the [API Documentation](./api.md) and [Architecture](./architecture.md) documents.
