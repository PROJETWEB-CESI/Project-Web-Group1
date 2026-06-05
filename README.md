# NovaCampus Alliance - Web Platform

Modular, microservices-based ERP system for the NovaCampus higher education alliance (multi-campus management, academic records, billing, scheduling, AI assistance, etc.).

Built with Next.js (frontend), Node/Express + Sequelize (services), PostgreSQL/Mongo/Redis, Docker, Nginx gateway.

## Quick Start

```ps
# 1. Copy environment template and customize (see below for test credentials)
copy .env.exemple .env

# 2. Clean previous images (recommended for fresh build)
docker compose down --rmi all

# 3. Build and start the entire stack
docker compose up --build
```

Wait until you see healthy services in `docker compose ps` and the frontend log line like:

```
nova-frontend    |  GET / 200 in 74ms (next.js: 5ms, application-code: 69ms)
```

The application is then available at:

- **http://localhost** (via outer Nginx with TLS termination - recommended)
- **http://localhost:3000** (direct to Next.js frontend - useful for dev)

## Environment & Configuration

- Copy `.env.exemple` → `.env`
- Key variables are documented inline in `.env.exemple`
- `NODE_ENV=development` enables more logs and (optionally) test credentials.
- Frontend uses `NEXT_PUBLIC_*` vars for API base (proxied through gateway/nginx in the stack).

## Test / Development Credentials

For rapid testing of role-based features and redirects (login page + dashboards):

1. In your `.env`, set:

   ```
   ENABLE_TEST_CREDENTIALS=true
   ```

2. Recreate the IAM service (env changes only take effect on container creation!):

   ```ps
   docker compose up -d --force-recreate iam-service
   ```
   (Include --build if you also edited code.)

3. Use these accounts on the login page (`/login`):

   | Role       | Email                  | Password     | Redirects to             |
   |------------|------------------------|--------------|--------------------------|
   | Student    | student@test.com       | student123   | /dashboard/student       |
   | Teacher    | teacher@test.com       | teacher123   | /dashboard/teacher       |
   | Admin      | admin@test.com         | admin123     | /dashboard/admin         |
   | Executive  | executive@test.com     | executive123 | /dashboard/executive     |

These accounts are **only seeded** when `ENABLE_TEST_CREDENTIALS=true` (and you recreated the container after setting it in .env) and **must never be enabled in production**.

See [services/iam-service/README.md](services/iam-service/README.md) for the full IAM API documentation, endpoints, and more details on test seeding.

## Documentation & Services

- **Root / Overview**: This file
- **IAM Service** (auth, users, JWT, roles): [services/iam-service/README.md](services/iam-service/README.md)
- **Frontend**: `frontend/nova-campus-web/` (Next.js + Tailwind + shared design system)
- **Gateway**: `services/gateway/nginx.conf` (API routing + prefix stripping)
- **Other services**: academic (students/grades/attendance), scheduling, billing, reporting, ai-agent
- Git workflow & versioning: [docs/NovaCampus_Git_Versioning_Guide.md](docs/NovaCampus_Git_Versioning_Guide.md)

## Login & Role-based Access

Visiting `/` will:

- Redirect to `/login` if not authenticated.
- After successful login, redirect to the appropriate dashboard based on the user's role (`student` / `teacher` / `admin` / `executive`).

The login page supports the full theme system (light/dark/high-contrast toggle, persisted).

## Accessibility & Compliance

- WCAG / RGAA friendly (high contrast mode, proper contrast calculation using relative luminance, keyboard accessible, ARIA).
- GDPR/RGPD compliant auth flows with privacy notices.

## Development Notes

- Before every commit: run `.\scripts\sync-gitkeep.ps1`
- Prefer English everywhere (code, docs, messages).
- Use shared components (`components/shared/`) and design tokens in `globals.css` to avoid duplication.
- Test with the full `docker compose` stack when backend is involved.