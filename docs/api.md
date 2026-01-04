# API Documentation

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Extractions

#### Create Extraction

```http
POST /api/v1/extractions
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
columns: "column1, column2" (optional)
multiple_tables: true/false (optional)
output_format: "json" | "csv" | "excel" (optional, default: "json")
```

**Response:**
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
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Get Extraction

```http
GET /api/v1/extractions/{id}
Authorization: Bearer <token>
```

**Response:**
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
  "output_file_path": "./outputs/extraction_1.json",
  "created_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:05:00Z"
}
```

#### List Extractions

```http
GET /api/v1/extractions?page=1&page_size=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

#### Download Extraction

```http
GET /api/v1/extractions/{id}/download
Authorization: Bearer <token>
```

**Response:** File download

#### Delete Extraction

```http
DELETE /api/v1/extractions/{id}
Authorization: Bearer <token>
```

**Response:** 204 No Content

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

Rate limits are tracked per user:
- Requests per minute (RPM): 60
- Tokens per minute (TPM): 32,000
- Requests per day (RPD): 1,500

When rate limits are exceeded, the API returns `429 Too Many Requests`.

