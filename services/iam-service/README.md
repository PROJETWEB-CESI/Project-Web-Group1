# IAM Service — /api/auth

Authentication and user management service for NovaCampus Alliance.

## Authentication

- The `register` and `login` endpoints are public.
- All other endpoints require an `Authorization: Bearer <token>` header.
- The JWT token contains: `id`, `email`, `role`, `campusId`.
- Supported roles: `student`, `teacher`, `admin`, `executive`.
- User management (`/users`) is restricted to `admin` and `executive` roles.

---

## Endpoints

| Method | URL | Action |
|--------|-----|--------|
| **POST** | `/api/auth/register` | Create a user account (public, defaults to `student` role, campusId optional) |
| **POST** | `/api/auth/login` | Authenticate a user and return a JWT token + profile |
| **GET** | `/api/auth/validate` | Validate a JWT token (returns the user's claims) |
| **GET** | `/api/auth/me` | Retrieve the full profile of the authenticated user |
| **GET** | `/api/auth/users?role=&campusId=&status=` | List users (filters: `role`, `campusId`, `status` — admin/exec only) |
| **POST** | `/api/auth/users` | Create a user with a specific role and campusId (admin/exec only) |
| **GET** | `/api/auth/users/:id` | Retrieve the full profile of a user (admin/exec) |
| **PUT** | `/api/auth/users/:id` | Update a user (admin/exec) |
| **DELETE** | `/api/auth/users/:id` | Delete a user (admin/exec) |

---

## Response Examples

### POST /api/auth/register (201)
```json
{
  "id": "9948aa28-579a-4d25-95ee-44925143380f",
  "status": "active",
  "email": "student@etu.novacampus.fr",
  "role": "student",
  "campusId": "CAMP001",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-06-04T14:43:01.860Z",
  "updatedAt": "2026-06-04T14:43:01.860Z"
}
```

### POST /api/auth/login (200)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "student@etu.novacampus.fr",
    "role": "student",
    "campusId": "CAMP001",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET /api/auth/validate (200)
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "role": "student",
    "campusId": "CAMP001",
    "iat": 1780584182,
    "exp": 1781188982
  }
}
```

### GET /api/auth/users (403 if not admin/exec)
```json
{
  "error": "Forbidden"
}
```

---

## Notes

- IDs are UUIDs.
- `campusId` is required for most business operations (multi-tenancy).
- This service is the single source of truth for identity and permissions (IAM).
- The Gateway (nginx) strips the `/api/auth` prefix before forwarding requests to the service.

For implementation details, see the files under `src/auth/` and `src/users/`.

## Test / Dev Credentials

When `ENABLE_TEST_CREDENTIALS=true` (see root `.env.exemple` and the default-to-false behavior when omitted), **and you have recreated the iam-service container after the change**, the IAM service automatically seeds the following test accounts on startup (in `startServer`):

- Student: `student@test.com` / `student123` (role: `student`, campusId: `CAMP001`)
- Teacher: `teacher@test.com` / `teacher123` (role: `teacher`, campusId: `CAMP001`)
- Admin: `admin@test.com` / `admin123` (role: `admin`, campusId: `CAMP001`)
- Executive: `executive@test.com` / `executive123` (role: `executive`, campusId: `CAMP001`)

Use these via the login page at `/login` (or directly via POST /api/auth/login). You will be redirected to the corresponding dashboard based on role.

**These credentials are for development and testing only. If `ENABLE_TEST_CREDENTIALS` is missing, empty, false, or any non-enabling value in .env (defaults to false **and removes any existing test accounts** so logins stop working). Set explicitly to true only for dev; never in production. Remember to recreate the container after changing the value in .env.**

The test script `scripts/test-scheduling.js` (at root) uses one of these accounts (admin) to exercise authenticated flows + cookie forwarding through the gateway before testing scheduling endpoints.
