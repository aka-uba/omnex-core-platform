# API Documentation - Omnex SaaS Platform

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require JWT token in Authorization header:

```http
Authorization: Bearer <access_token>
```

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-27T00:00:00.000Z",
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-11-27T00:00:00.000Z"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication Endpoints

### POST /api/auth/login

Login with credentials.

**Request:**
```json
{
  "username": "admin@omnexcore.com",
  "password": "uba1453.2010*",
  "tenantSlug": "optional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Super Admin",
      "email": "admin@omnexcore.com",
      "role": "SuperAdmin",
      "tenantSlug": "omnexcore"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "sessionId": "sess_..."
  }
}
```

### POST /api/auth/refresh

Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_token...",
    "user": { ... }
  }
}
```

### POST /api/auth/logout

Logout and clear session.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## User Endpoints

### GET /api/users

List users with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 10)
- `search` (string): Search by name or email
- `role` (string): Filter by role
- `status` (string): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### POST /api/users

Create new user.

**Request (FormData):**
```
fullName: "John Doe"
email: "john@example.com"
password: "SecurePass123!"
role: "ClientUser"
phone: "+90-555-1234"
department: "IT"
position: "Developer"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ClientUser",
      "status": "pending"
    }
  }
}
```

---

## Tenant Endpoints

### GET /api/tenants

List all tenants (SuperAdmin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "...",
        "name": "Acme Corp",
        "slug": "acme",
        "status": "active",
        "subdomain": "acme"
      }
    ]
  }
}
```

### POST /api/tenants

Create new tenant (SuperAdmin only).

**Request:**
```json
{
  "name": "Acme Corp",
  "slug": "acme",
  "subdomain": "acme",
  "agencyId": "optional"
}
```

---

## Health Check Endpoints

### GET /api/health

Basic health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-27T00:00:00.000Z",
  "version": "1.0.8",
  "service": "omnex-core-platform"
}
```

### GET /api/health/detailed

Detailed health check with database status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-27T00:00:00.000Z",
  "version": "1.0.8",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Core database connected"
    },
    "tenants": {
      "status": "ok",
      "count": 3
    }
  }
}
```

---

## Rate Limiting

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**Limits:**
- Global: 100 requests / 15 minutes
- Auth endpoints: 10 requests / 15 minutes

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
```
?page=1&limit=10
```

**Response Meta:**
```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "timestamp": "..."
  }
}
```

---

## Examples

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@omnexcore.com","password":"uba1453.2010*"}'

# Get users (with token)
curl -X GET http://localhost:3000/api/users?page=1&pageSize=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript (Fetch)

```javascript
// Login
const login = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin@omnexcore.com',
    password: 'uba1453.2010*'
  })
});
const { data } = await login.json();
const token = data.accessToken;

// Get users
const users = await fetch('/api/users?page=1', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const usersData = await users.json();
```

---

## Webhooks (Future)

Webhook support planned for v2.0.0.

---

**Version:** 1.0.8  
**Last Updated:** 2025-11-27
