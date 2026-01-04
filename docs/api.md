# API Documentation

## Base URL

**Production:**

```text
https://api.extractable.in/api/v1
```

**Development:**

```text
http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

Tokens are obtained via `/api/v1/auth/login` or `/api/v1/auth/register` and expire after 30 minutes by default.

## API Versioning

The API uses URL path-based versioning. The current version is `v1`. Check available versions:

```http
GET /api/versions
```

Response:

```json
{
  "current_version": "v1",
  "supported_versions": ["v1"]
}
```

## Rate Limiting

Rate limits are enforced per user:

- **RPM**: 60 requests per minute
- **TPM**: 32,000 tokens per minute
- **RPD**: 1,500 requests per day

When rate limits are exceeded, the API returns `429 Too Many Requests` with retry information.

## Authentication Endpoints

### Register User

Create a new user account.

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": null,
  "last_name": null,
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Notes:**

- Sends welcome email automatically
- Password must meet security requirements
- Email must be unique

### Login

Authenticate and receive JWT token.

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Refresh Token

Refresh an existing JWT token.

```http
POST /api/v1/auth/refresh
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Get Current User

Get authenticated user's profile.

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Forgot Password

Request a password reset email.

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

**Notes:**

- Always returns success (security best practice)
- Sends email with reset token if email exists
- Token expires in 1 hour

### Reset Password

Reset password using token from email.

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "new_password": "newsecurepassword123"
}
```

**Response:** `200 OK`

```json
{
  "message": "Password has been reset successfully."
}
```

## User Management Endpoints

### Get User Profile

```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Update User Profile

```http
PATCH /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T01:00:00Z"
}
```

### Change Password

```http
PATCH /api/v1/users/me/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

**Response:** `200 OK`

```json
{
  "message": "Password updated successfully"
}
```

## Extraction Endpoints

### Create Extraction

Create a new extraction job. Files are processed asynchronously via a priority queue.

```http
POST /api/v1/extractions
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF or image file>
columns: "column1, column2" (optional)
multiple_tables: true (optional, default: false)
complexity: "regular" (optional: simple, regular, complex)
priority: "medium" (optional: high, medium, low)
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "user_id": 1,
  "status": "pending",
  "input_type": "pdf",
  "input_filename": "document.pdf",
  "columns_requested": ["column1", "column2"],
  "multiple_tables": false,
  "output_format": "json",
  "complexity": "regular",
  "priority": "medium",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Notes:**

- File size limit: 10MB
- Supported formats: PDF, PNG, JPEG, JPG
- Job is queued with specified priority
- Status will change: `pending` → `processing` → `completed` or `failed`
- Use SSE endpoint or polling to track status

### Get Extraction

Get details of a specific extraction.

```http
GET /api/v1/extractions/{id}
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "user_id": 1,
  "status": "completed",
  "input_type": "pdf",
  "input_filename": "document.pdf",
  "columns_requested": ["column1", "column2"],
  "multiple_tables": false,
  "output_format": "json",
  "complexity": "regular",
  "priority": "medium",
  "table_data": {
    "columns": ["column1", "column2"],
    "rows": [
      {"column1": "value1", "column2": "value2"},
      {"column1": "value3", "column2": "value4"}
    ]
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:05:00Z",
  "completed_at": "2024-01-01T00:05:00Z"
}
```

### List Extractions

Get paginated list of user's extractions.

```http
GET /api/v1/extractions?page=1&page_size=20&status=completed
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (`pending`, `processing`, `completed`, `failed`)

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": 1,
      "status": "completed",
      "input_filename": "document.pdf",
      "created_at": "2024-01-01T00:00:00Z",
      ...
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "pages": 5
}
```

### Update Extraction

Update extraction metadata (limited when processing).

```http
PATCH /api/v1/extractions/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "input_filename": "renamed-document.pdf"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "input_filename": "renamed-document.pdf",
  ...
}
```

**Notes:**

- Only `input_filename` can be updated when status is `processing`
- Other fields are blocked during processing
- Full update allowed when status is `pending` or `completed`

### Download Extraction

Download extraction results in specified format.

```http
GET /api/v1/extractions/{id}/download?format=excel
Authorization: Bearer <token>
```

**Query Parameters:**

- `format` (optional): Output format (`json`, `csv`, `excel`) - default: `json`

**Response:** `200 OK`

- Content-Type: `application/json`, `text/csv`, or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="extraction_1.{format}"`

**Notes:**

- Data is converted on-the-fly from stored JSON
- Excel format requires `xlsxwriter` library

### Stream Extraction Updates (SSE)

Get real-time updates for an extraction via Server-Sent Events.

```http
GET /api/v1/extractions/{id}/stream
Authorization: Bearer <token>
Accept: text/event-stream
```

**Response:** `200 OK` (streaming)

```json
data: {"type": "connected", "extraction_id": 1}

data: {"type": "status_update", "extraction_id": 1, "status": "processing", "message": "Processing started"}

data: {"type": "notification", "extraction_id": 1, "title": "Extraction Started", "message": "Extraction #1 has started processing", "notification_type": "info"}

data: {"type": "status_update", "extraction_id": 1, "status": "completed", "message": "Processing completed"}

: keepalive
```

**Notes:**

- Connection stays open until extraction completes or client disconnects
- Keepalive pings sent every 30 seconds
- Use EventSource API in frontend

### Delete Extraction

Delete an extraction and its data.

```http
DELETE /api/v1/extractions/{id}
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Notes:**

- Cannot delete while `processing`
- Permanently removes extraction and associated data

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message description"
}
```

### Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no content
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Example Error Responses

**401 Unauthorized:**

```json
{
  "detail": "Could not validate credentials"
}
```

**404 Not Found:**

```json
{
  "detail": "Extraction not found"
}
```

**422 Validation Error:**

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

**429 Rate Limit Exceeded:**

```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

## Webhooks & Real-Time Updates

### Server-Sent Events (SSE)

For real-time extraction updates, use the SSE endpoint:

```javascript
const eventSource = new EventSource(
  'https://api.extractable.in/api/v1/extractions/1/stream',
  {
    headers: {
      'Authorization': 'Bearer <token>'
    }
  }
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

**Event Types:**

- `connected` - Connection established
- `status_update` - Status changed
- `notification` - Notification message
- `keepalive` - Keepalive ping

## API Client Examples

### Python

```python
import requests

BASE_URL = "https://api.extractable.in/api/v1"

# Login
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "user@example.com", "password": "password"}
)
token = response.json()["access_token"]

# Create extraction
headers = {"Authorization": f"Bearer {token}"}
with open("document.pdf", "rb") as f:
    files = {"file": f}
    data = {
        "columns": "name, email, phone",
        "priority": "high"
    }
    response = requests.post(
        f"{BASE_URL}/extractions",
        headers=headers,
        files=files,
        data=data
    )
    extraction = response.json()

# Check status
extraction_id = extraction["id"]
response = requests.get(
    f"{BASE_URL}/extractions/{extraction_id}",
    headers=headers
)
status = response.json()["status"]
```

### JavaScript/TypeScript

```typescript
const BASE_URL = 'https://api.extractable.in/api/v1';

// Login
const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});
const { access_token } = await loginResponse.json();

// Create extraction
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('columns', 'name, email, phone');
formData.append('priority', 'high');

const createResponse = await fetch(`${BASE_URL}/extractions`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` },
  body: formData
});
const extraction = await createResponse.json();

// Stream updates
const eventSource = new EventSource(
  `${BASE_URL}/extractions/${extraction.id}/stream`,
  {
    headers: { 'Authorization': `Bearer ${access_token}` }
  }
);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

### cURL

```bash
# Login
TOKEN=$(curl -X POST https://api.extractable.in/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.access_token')

# Create extraction
curl -X POST https://api.extractable.in/api/v1/extractions \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "columns=name,email,phone" \
  -F "priority=high"

# Get extraction
curl -X GET https://api.extractable.in/api/v1/extractions/1 \
  -H "Authorization: Bearer $TOKEN"

# Download results
curl -X GET "https://api.extractable.in/api/v1/extractions/1/download?format=excel" \
  -H "Authorization: Bearer $TOKEN" \
  -o extraction.xlsx
```

## Interactive API Documentation

Visit the interactive API documentation:

- **Swagger UI**: `https://api.extractable.in/docs`
- **ReDoc**: `https://api.extractable.in/redoc`
- **OpenAPI JSON**: `https://api.extractable.in/openapi.json`

## Best Practices

1. **Token Management**: Store tokens securely, refresh before expiration
2. **Error Handling**: Always check status codes and handle errors gracefully
3. **Rate Limiting**: Implement exponential backoff for 429 responses
4. **File Uploads**: Show progress indicators for large files
5. **Status Polling**: Use SSE when possible, otherwise poll every 2-5 seconds
6. **Retry Logic**: Retry transient failures (5xx errors) with backoff
7. **Validation**: Validate data client-side before sending requests

## TODO: Future API Features

See [TODO.md](../../TODO.md) for planned API enhancements:

- [ ] Webhook endpoints for job status updates
- [ ] Batch extraction endpoints
- [ ] API key management for vendor integrations
- [ ] GraphQL API option
- [ ] WebSocket support for real-time updates
- [ ] API usage analytics endpoint
