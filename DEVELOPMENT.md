# NovaCampus Development Guide

This guide explains how to develop the frontend and backend correctly, following the project's architecture, conventions, and shared systems (themes, languages, components, etc.).

## Quick Start for Development

```ps
# 1. Copy env (if not already done)
copy .env.exemple .env

# 2. Start the FULL stack (required for any integration work)
docker compose up -d --build

# Access via outer nginx (standard):
# https://localhost/
```

- Use **https://localhost/** as the **primary and standard** access point for both development and production testing. This routes through the outer nginx for realistic routing, rate limiting, and same-origin `/api` calls.
- Direct access to `http://localhost:3000` (frontend) or `http://localhost:8080` (gateway) is possible for targeted debugging but may require the dev proxy fix (see below).
- **Never** start only one service for testing features that cross boundaries.

After changes to frontend source (thanks to volume mounts), the Next dev server usually picks them up. For backend changes, you may need to restart the specific service or use `--build`.

## Frontend Development

### Running the Frontend Dev Server

- **Standard**: Full `docker compose up -d --build` (the `frontend` service runs in dev mode with Turbopack).
- The `src` directory is mounted in docker, so edits are reflected quickly.
- Direct local dev server (`npm run dev`) is possible for targeted debugging but not recommended for integration work.

### Theming System (Light / Dark / High-Contrast)

We have a first-class, persisted, system-aware theme system.

- **Core**: `src/context/ThemeContext.js` + CSS custom properties in `globals.css`.
  - `:root` = light
  - `.dark` on `<html>` = dark
  - `.high-contrast` on `<html>` = high contrast (WCAG/RGAA focused)
- **Usage**:
  - Use CSS variables everywhere: `var(--color-primary)`, `var(--color-bg)`, `var(--color-text)`, `var(--color-on-primary)`, `--color-link`, etc.
  - Never hardcode colors like `#fff`, `text-white` (except inside `.high-contrast` careful pairs or when using `--color-on-primary`).
  - The `ThemeToggle` component (shared) handles cycling + direct selectors.
- **High-contrast specifics**:
  - We use a real luminance + contrast ratio calculation (`src/lib/contrast.js`) to choose/verify colors.
  - Black on yellow (or yellow on black) for primary elements. **Never white-on-yellow**.
  - Larger text, thicker borders, strong focus rings are applied via CSS.
- **In components**: Import `useTheme` only if you need `isHighContrast` / `isDark` for logic. Prefer CSS vars for styling.
- **Adding tokens**: Add to `:root`, `.dark`, and `.high-contrast` in `globals.css`. Update the contrast verification if relevant.
- **Global toggle**: Always available (fixed in layout). Persisted in `localStorage`.

**Rule**: All themeable UI must use the shared token system. Duplicating colors = bug.

### Language / i18n System (English ↔ French)

Similar client-side persisted system to themes.

- **Core**: `src/context/LanguageContext.js`
  - `language` ('en' | 'fr')
  - `t(key)` helper
  - `setLanguage` / `toggleLanguage`
  - Auto-detects from `navigator.language` on first run (prefers `fr`).
  - Persisted in `localStorage` as `language`.
  - Sets `<html lang="...">`.
- **Usage**:
  ```jsx
  const { t, language, isFrench } = useLanguage();
  <h2>{translate('welcomeBack')}</h2>
  <p>{translate('signInToAccess')}</p>
  ```
- **Adding translations**: Edit the `translations` object in `LanguageContext.js`. English is the source of truth. Provide matching French strings.
- **The toggle**: `LanguageToggle` (shared), placed next to `ThemeToggle` in the layout. Supports cycle + direct buttons.
- **Theme labels** are also translated when the language changes (via the context).
- **Pages/components to update**: Use `translate()` for user-facing strings (login, footer, privacy, accessibility, loading states, etc.). Brand names ("NovaCampus") and technical terms usually stay in English.
- The `LanguageProvider` must wrap the app (it does, in `layout.js`).

**Current scope**: Primarily the login flow, footer, privacy/accessibility pages, and toggle UIs. Expand as new UI is added.

**Rule**: Do not hardcode English strings in new components. Use `translate()` + add the key.

### Reusing Components & Avoiding Duplication

- **Single source of truth**: `src/components/shared/`
  - `Button.jsx`, `Input.jsx`, `Footer.jsx`, `ThemeToggle.jsx`, `LanguageToggle.jsx`, `ProtectedRoute.jsx` (if used).
- **Always import from shared** instead of copying markup or styles.
  - Example: There is **one** `<Footer />` — rendered in the root layout. Do not create per-page footers.
- **Styling rules** (professional low-duplication):
  1. Put general styles, base component styles, and **design tokens** (CSS vars) in `globals.css`.
  2. Use Tailwind utility classes on top of the tokens.
  3. Component-specific styles only inside the shared component (or via props/variants).
  4. Page-specific overrides are the exception, not the rule.
  5. **Button ordering (UI convention)**: For any buttons involving continue/confirm/primary action + cancel/undo/back/secondary, put the cancel/undo on the **left** and the continue/confirm on the **right**. Example: `[ Cancel ] [ Confirm ]` or `[ Undo ] [ Save ]`. Follows standard OS/web patterns and prevents accidental destructive actions.
- The root layout provides the providers (`LanguageProvider`, `ThemeProvider`, `AuthProvider`) and the global fixed toggles + single Footer.
- **Auth**: Use `useAuth()` from `AuthContext`. It handles token storage, automatic `/me` validation on load, `login()`, `logout()`, and `isAuthenticated`.
- **Forms**: Prefer the shared `Input` + `Button`. They already handle labels, errors, focus, disabled states, and theme vars.

**Example of correct reuse** (login page):
```jsx
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';

const { translate } = useLanguage();
// ...
<Input label={translate('emailAddress')} ... />
<Button>{translate('signIn')}</Button>
```

### API Calls & Proxying (Important for Login / Backend)

- Use relative `/api/...` in frontend code (e.g. `/api/auth/login`).
- **Standard access via `https://localhost/`**: Outer nginx routes `/api/*` → gateway → services. No special config needed in the browser.
- **When running Next dev server directly** (localhost:3000):
  - `next.config.mjs` rewrites `/api/*` → the gateway.
  - We set `DEV_API_PROXY_TARGET=http://gateway:80` inside docker-compose for the frontend service (so the container can resolve the `gateway` service name).
- If you get 500 on `/api/auth/login` (or any API) when hitting :3000 directly:
  - Make sure the gateway is running.
  - Make sure you are using the correct proxy target (check `.env` / docker-compose).
  - Prefer going through the outer nginx (`https://localhost/`).

In `AuthContext.js` we use `const API_BASE = '/api/auth';`.

### Other Frontend Tips

- **Loading / redirect states**: The root page acts as an auth guard and role-based router. Keep it lightweight.
- **Dashboards**: Role-specific routes live under `/dashboard/*`. Use the shared auth context + role checks.
- **Accessibility**: The high-contrast mode + language support + proper labels (in shared Input) are part of the RGAA/GDPR requirements from the workshops. Test with the toggle.

## Backend Development (Focus: IAM Service)

The identity service is the source of truth for users, roles, JWTs, and campus tenancy.

### Running & Testing

- Always start via full `docker compose up -d --build`.
- Test credentials (for rapid role testing):
  1. In `.env`: `ENABLE_TEST_CREDENTIALS=true`
  2. Recreate the iam service (required for env var to take effect): `docker compose up -d --force-recreate iam-service`
   (Add --build if you also changed source code.)
  3. The users are seeded on startup. See logs for `[DEV] Seeded test user...`.
  4. Setting `ENABLE_TEST_CREDENTIALS=false` (or omitting) + recreate will **remove** the test accounts (logins will then fail). See `[DEV] Removed test user...` in logs.
  5. Logins (when enabled):
     - `student@test.com` / `student123` → student
     - `teacher@test.com` / `teacher123` → teacher
     - etc.
  6. **Never** leave this enabled in production. Documented in root README and iam-service README.

- **Scheduling service tests** (detailed classic + edge + security/injection):
  Run `node scripts/test-scheduling.js` (after enabling test creds + full stack up).
  It logs in with admin@test.com (using the httpOnly cookies through the gateway), then runs 40+ assertions on rooms/timetables (CRUD, every overlap scenario, filters, bad data, unauthed vs tampered cookies, SQL-ish injection attempts, large payloads, etc.).
  The script only succeeds when test users exist (dev-only). It always cleans TST* data.

- The gateway strips `/api/auth` prefix. Routes inside the service are mounted at root (see `auth.route.js`).

### Key Architecture Points

- **Sequelize + Postgres**: Models in `src/models/`. `sync({ alter: true })` in dev.
- **JWT**: Claims = `{ id, email, role, campusId }`. Use the shared `jwt.util.js`.
- **Passwords**: Use the shared `bcrypt.util.js` (never store plain text).
- **Auth flow**:
  - `POST /api/auth/login` → returns `{ token, user: safeUser }`
  - Protected routes use `authenticate` middleware (checks Bearer token, attaches `req.user`).
  - Frontend `AuthContext` stores the token and calls `/me` on load.
- **Roles**: `student | teacher | admin | executive`. Some endpoints (user management) are admin/exec only.
- **Multi-tenancy**: Almost everything is scoped by `campusId`.
- **Error responses**: Keep them generic for security (no user enumeration). The controller wraps service errors.
- **Health**: `/api/health` for docker checks.

### Adding Backend Features

- Keep services focused.
- Document new endpoints in the service's `README.md` (Method | URL | Action table style).
- Use the existing patterns for controllers/services/routes/middleware.
- When the gateway or nginx config changes, remember to test through the full routing path.

### Environment Variables (IAM)

See the `environment` block in `docker-compose.yml` and the root `.env.exemple`. Key ones for auth:
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `ENABLE_TEST_CREDENTIALS`
- DB connection vars (point to the `postgres` service in compose)

## General Best Practices

- **Testing**: For anything involving login, auth, themes, languages, or cross-service calls → **full `docker compose up -d --build`**. Do not rely on isolated `npm run dev` for backend-dependent features.
- **Rebuilds**: After changing docker env vars (like `ENABLE_TEST_CREDENTIALS` or `DEV_API_PROXY_TARGET`), recreate the affected service(s).
- **Git hygiene**: Run `.\scripts\sync-gitkeep.ps1` **before every commit**. No "finished" in messages. English in code/comments.
- **Shared nothing duplication**: One Footer. One set of theme tokens. One language system. One auth context. Reuse via `components/shared` and contexts.
- **When in doubt**:
  - Look at existing shared components and the login page for patterns.
  - Check `globals.css` for tokens before writing custom colors.
  - Read the service READMEs and the root `README.md`.

## Common Pitfalls & Fixes

- **Login 500 when using :3000 directly**: The Next dev proxy couldn't reach the gateway. Use the standard `https://localhost/` or ensure `DEV_API_PROXY_TARGET` is correct for your environment (see next.config and docker-compose).
- **Theme not applying**: Forgot to wrap in `ThemeProvider`, or used hardcoded colors instead of vars, or missing `min-h-0` / height constraints in flex layouts.
- **Language not switching**: Not using `translate()` from `useLanguage()`, or component not inside the provider tree, or missing the key in the translations object.
- **Components not themed**: Hardcoded Tailwind colors or `text-white` outside of `--color-on-primary` usage.
- **Footer appears twice**: You created a local footer instead of using the shared one from layout.
- **Scroll on short pages (e.g. login)**: Use the flex-1 + `min-h-dvh` + `min-h-0` pattern established in the layout and login page (see recent fixes).
- **Test users not present**: `ENABLE_TEST_CREDENTIALS` not set to true in the `.env` that docker compose reads for variable substitution, **or** the iam-service container was not recreated after the change (env vars are injected only when the container is created, use `docker compose up -d --force-recreate iam-service` to fix).

## Further Reading

- Root `README.md` (quick start, test credentials table)
- `services/<service-name>/README.md` (endpoints + test creds)
- Workshop deliverables (for original requirements around accessibility, RGPD, microservices, etc.)

Happy coding! When adding new UI, ask: "Is this using the shared theme tokens, shared components, and the language `translate()` helper?"
