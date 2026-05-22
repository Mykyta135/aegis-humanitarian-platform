# Aegis Humanitarian Platform

A full-stack web application for coordinating humanitarian aid missions — managing volunteers, resources, and field operations in real time.

---

## Architecture

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | Next.js 16 (App Router) | 3001 |
| Backend | NestJS 11 + TypeORM | 3000 |
| Database | PostgreSQL 14 | 5432 |

All three services are containerised and orchestrated with Docker Compose.

---

## Features

- **Mission management** — create, assign, and track field tasks with priority, difficulty, region, and status
- **Volunteer management** — profile management, skill/experience tracking, availability status
- **Resource management** — vehicles, generators, drones, medical kits with condition and status tracking
- **Live operations map** — real-time volunteer location updates over WebSockets (Socket.IO), threat zone overlays, route planning via OpenRouteService
- **Mission wizard** — step-by-step mission creation with geocoding, map-based destination picking, and AI task suggestions
- **Analytics dashboard** — mission statistics, volunteer performance, resource utilisation charts
- **Notifications** — real-time in-app notification centre
- **Authentication** — JWT-based auth with role-based access (admin / volunteer)

---

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development only)

### Run with Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Swagger docs | http://localhost:3000/api |

### Seed the database

After the backend is running, trigger the seed endpoint once to populate demo data (100 volunteers, 40 resources, 150 missions):

```bash
curl -X POST http://localhost:3000/seed
```

Demo accounts created by the seed:

| Email | Password | Role |
|-------|----------|------|
| admin@aegis.local | password123 | Admin |
| coordinator@aegis.local | password123 | Admin |
| medic@aegis.local | password123 | Volunteer |
| driver@aegis.local | password123 | Volunteer |
| trainee@aegis.local | password123 | Volunteer |
| engineer@aegis.local | password123 | Volunteer |

---

## Project Structure

```
.
├── docker-compose.yml
├── dyploma-backend/        # NestJS API
│   └── src/modules/
│       ├── auth/           # JWT authentication
│       ├── users/          # Volunteer profiles
│       ├── tasks/          # Mission management
│       ├── resources/      # Resource inventory
│       ├── routing/        # OpenRouteService integration
│       ├── suggestions/    # AI task suggestions
│       ├── threat-zones/   # Danger zone overlays
│       ├── operations/     # Live operations & WebSocket gateway
│       ├── analytics/      # Dashboard statistics
│       └── seed/           # Manual database seeder
└── frontend/               # Next.js app
    └── app/
        ├── (dashboard)/    # Protected dashboard routes
        │   ├── page.tsx    # Main dashboard
        │   ├── map/        # Live operations map
        │   ├── tasks/      # Mission list & detail
        │   ├── volunteers/ # Volunteer directory
        │   ├── manage/     # Admin management panel
        │   └── analytics/  # Charts & statistics
        ├── login/
        └── register/
```

---

## Local Development (without Docker)

### Backend

```bash
cd dyploma-backend
npm install
# copy and edit environment variables
cp .env.example .env
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3000 npm run dev
```

---

## Environment Variables

### Backend (`dyploma-backend/.env`)

| Variable | Description |
|----------|-------------|
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_DATABASE` | Database name |
| `JWT_SECRET` | Secret key for JWT signing |
| `FRONTEND_URL` | Frontend origin for CORS |
| `OPENROUTESERVICE_API_KEY` | API key for route calculation |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | MapTiler API key for map tiles |
