# Auth Endpoints

No authentication required for these endpoints.

## Obtain Token

```
POST /api/v1/auth/token/
```

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

## Refresh Token

```
POST /api/v1/auth/token/refresh/
```

**Request:**
```json
{
  "refresh": "eyJ..."
}
```

**Response 200:**
```json
{
  "access": "eyJ..."
}
```

## Verify Token

```
POST /api/v1/auth/token/verify/
```

**Request:**
```json
{
  "token": "eyJ..."
}
```

**Response 200:** `{}` (empty = valid)
**Response 401:** token invalid/expired
