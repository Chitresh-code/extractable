# Extractable - TODO & Feature Roadmap

## Current Priority Tasks

### 🔔 Notifications & Email
- [ ] Fix notifications system for extraction jobs
- [ ] Add email notification preferences for extraction jobs
  - [ ] Email on job creation
  - [ ] Email on job start
  - [ ] Email on job completion
  - [ ] Email on job failure
  - [ ] User preference settings for notification types

### ✉️ Email Verification
- [ ] Implement email verification before starting extraction jobs
  - [ ] Send verification email on registration
  - [ ] Verify email endpoint
  - [ ] Block job creation if email not verified
  - [ ] Resend verification email option
  - [ ] Update user model with email verification status

### ✏️ Table Editing
- [ ] Enable editing of generated tables
  - [ ] Inline cell editing in table view
  - [ ] Add/remove rows and columns
  - [ ] Save edited tables back to database
  - [ ] Version history for edited tables
  - [ ] Undo/redo functionality

### 🔗 Sharing & Collaboration
- [ ] Implement sharing for generated extractions
  - [ ] Generate shareable links (public/private)
  - [ ] Share via email
  - [ ] Permission levels (view, edit, admin)
  - [ ] Share expiration dates
  - [ ] Access control and permissions management

### 🔌 Vendor API
- [ ] Create vendor API for third-party integrations
  - [ ] API key management per user/organization
  - [ ] Rate limiting per API key
  - [ ] Webhook support for job status updates
  - [ ] API documentation (OpenAPI/Swagger)
  - [ ] SDKs for popular languages (Python, Node.js, etc.)
  - [ ] API versioning strategy

### 💰 Pricing & Gating
- [ ] Implement pricing tiers and gated services
  - [ ] Define pricing tiers (Free, Pro, Enterprise)
  - [ ] Usage limits per tier (extractions/month, file size, etc.)
  - [ ] Payment integration (Stripe/Paddle)
  - [ ] Subscription management
  - [ ] Usage tracking and billing
  - [ ] Upgrade/downgrade flows
  - [ ] Feature gating based on tier

## Future Feature Suggestions

### 📊 Analytics & Reporting
- [ ] User dashboard with extraction statistics
- [ ] Export history and analytics
- [ ] Usage reports and insights
- [ ] Success rate tracking
- [ ] Performance metrics per extraction

### 🔄 Advanced Extraction Features
- [ ] Batch processing for multiple files
- [ ] Scheduled extractions (cron-like)
- [ ] Custom extraction templates
- [ ] Multi-language table extraction
- [ ] OCR improvements for low-quality images
- [ ] Handwritten text recognition
- [ ] Table structure detection improvements

### 🗂️ Organization & Management
- [ ] Folders/projects for organizing extractions
- [ ] Tags and labels for extractions
- [ ] Search functionality (full-text search)
- [ ] Advanced filtering options
- [ ] Bulk operations (delete, export, share)
- [ ] Extraction templates and presets

### 🔐 Security & Compliance
- [ ] Two-factor authentication (2FA)
- [ ] Single Sign-On (SSO) support
- [ ] Audit logs for all actions
- [ ] Data retention policies
- [ ] GDPR compliance features
- [ ] Data encryption at rest
- [ ] IP whitelisting for API access

### 👥 Team & Collaboration
- [ ] Team/organization accounts
- [ ] Role-based access control (RBAC)
- [ ] Team member invitations
- [ ] Shared workspaces
- [ ] Team usage analytics
- [ ] Centralized billing for teams

### 🔧 Integration & Automation
- [ ] Zapier integration
- [ ] Make.com (Integromat) integration
- [ ] Google Sheets integration
- [ ] Airtable integration
- [ ] Slack notifications
- [ ] Microsoft Teams integration
- [ ] Webhook endpoints for custom integrations

### 📱 User Experience
- [ ] Mobile app (iOS/Android)
- [ ] Progressive Web App (PWA) support
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop file upload
- [ ] File preview before extraction
- [ ] Extraction progress indicators
- [ ] Real-time collaboration on extractions

### 🎨 Customization
- [ ] Custom branding for enterprise users
- [ ] Custom domain support
- [ ] White-label options
- [ ] Custom email templates
- [ ] Custom extraction workflows

### 🧪 Quality & Testing
- [ ] Extraction quality scoring
- [ ] Manual review queue for low-confidence extractions
- [ ] User feedback on extraction accuracy
- [ ] A/B testing for extraction models
- [ ] Quality metrics dashboard

### 📚 Documentation & Support
- [ ] Interactive API documentation
- [ ] Video tutorials
- [ ] Knowledge base/help center
- [ ] In-app help tooltips
- [ ] Community forum
- [ ] Status page for service uptime

### 🚀 Performance & Scalability
- [ ] Background job queue improvements
- [ ] Caching layer for frequently accessed data
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] Horizontal scaling support
- [ ] Load balancing

### 🔍 Advanced Features
- [ ] AI-powered data validation
- [ ] Automatic data type detection
- [ ] Data normalization options
- [ ] Custom field mapping
- [ ] Data transformation rules
- [ ] Export to multiple formats simultaneously
- [ ] Custom export templates

### 💼 Enterprise Features
- [ ] Dedicated support channels
- [ ] SLA guarantees
- [ ] Custom integrations
- [ ] On-premise deployment option
- [ ] Advanced security features
- [ ] Compliance certifications (SOC 2, ISO 27001)
- [ ] Custom contracts and pricing

### 🌐 Internationalization
- [ ] Multi-language support (i18n)
- [ ] Currency localization
- [ ] Regional data compliance
- [ ] Timezone handling improvements

### 📊 Data Management
- [ ] Data export in multiple formats (CSV, Excel, JSON, XML, Parquet)
- [ ] Data import from external sources
- [ ] Data validation rules
- [ ] Data deduplication
- [ ] Data merging capabilities

---

## Notes

- Tasks are organized by priority and category
- Check off items as they are completed
- Add new items as needed
- Review and update this list regularly during sprint planning

