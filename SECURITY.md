# Security

## Review, November 2026

Before linking this repository from my CV I reviewed it the way a hiring engineer or an attacker would: a secret scan of the full git history (gitleaks), a route-by-route check of authentication and authorization, and a smoke test of the built API on an empty database. The review was AI-assisted (Claude Code); every finding was checked by hand against the code, and every fix has a test or a smoke check.

### Fixed

| Area | Problem | Fix |
|---|---|---|
| JWT | The signing key was hard-coded in source, so anyone could sign an admin token | Key comes from `JWT_SECRET` (≥ 32 chars, boot fails without it); HS256 pinned |
| Users | Any logged-in volunteer could set their own `role` to admin or delete users; PATCHed passwords were stored unhashed | Writes are admin-only; volunteers read only their own profile; passwords hashed on update too |
| Seed | `POST /seed` (demo accounts with known passwords) was public | Exists only with `ENABLE_SEED=true` outside production |
| Live map | `POST /operations/location/:userId` had no auth; both Socket.IO gateways accepted anonymous connections from any origin | Location needs a login and only for yourself (admins: anyone); sockets require a valid token; CORS limited to `FRONTEND_URL` |
| Chat | Messages were saved under any `senderId` the client sent | Sender comes from the authenticated socket; length capped |
| Missions, resources, simulation | Any logged-in user could edit any mission, delete resources and drive the simulation | Creator/admin edit missions; resources and simulation are admin-only; logs and chat history only for mission participants |
| Requests | `requesterId` was taken from the request body | Taken from the token |
| Schema | `synchronize: true`, no migrations | TypeORM migrations, run on start; CI applies them to Postgres 14 and fails on schema drift |
| Git history | A hard-coded OpenRouteService API key (already rotated) | Removed from every commit; history rewritten |

Smoke test on a fresh database (migrations applied on start): volunteer → `GET /users` 403, other volunteer's profile 403, `PATCH` own role 403, other volunteer's location 403, anonymous location 401, resource delete 403, simulation 403; own profile 200, own location 201.

### Known limitations (thesis demo)

- One access token (1 day), no refresh-token rotation; the token lives in browser storage.
- Any signed-in user can join any mission's chat room over the socket (reading history over HTTP is restricted).
- No rate limiting on login.
- Demo `docker-compose.yml` uses fixed local DB credentials.

## Reporting

If you find something, please open a GitHub issue without exploit details and I will get in touch.
