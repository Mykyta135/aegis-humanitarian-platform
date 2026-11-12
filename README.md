<img src=".github/cover.png" alt="Aegis: humanitarian operations platform with a live volunteer map, route planning and role-based access" width="100%">

# Aegis Humanitarian Platform

[![CI](https://github.com/Mykyta135/aegis-humanitarian-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Mykyta135/aegis-humanitarian-platform/actions/workflows/ci.yml)

A full-stack web application for coordinating humanitarian aid missions — managing volunteers, resources, and field operations in real time. My Bachelor's thesis at Lviv Polytechnic.

<img src=".github/map.png" alt="Global Operations Map: 100 volunteers, 40 resources and 150 missions from the demo seed on a live map, with the movement simulation panel" width="100%">

---

## Architecture

```mermaid
flowchart LR
    subgraph web["frontend · Next.js 16 :3001"]
        MAP[Live operations map<br/>Leaflet]
        WIZ[Mission wizard]
        DASH[Analytics dashboard]
    end
    subgraph api["backend · NestJS 11 + TypeORM :3000"]
        AUTH[auth · JWT + roles]
        OPS[operations gateway]
        CHAT[chat gateway]
        MOD[tasks · resources · threat zones<br/>volunteer & resource requests]
        ROUTE[routing]
        SUG[suggestions]
    end
    DB[(PostgreSQL 14)]
    ORS[OpenRouteService]
    MAP <-- "Socket.IO: locationUpdate, notification" --> OPS
    web <-- "Socket.IO: chat" --> CHAT
    web -- REST --> AUTH & MOD & ROUTE & SUG
    ROUTE --> ORS
    api --> DB
```

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | Next.js 16 (App Router) | 3001 |
| Backend | NestJS 11 + TypeORM | 3000 |
| Database | PostgreSQL 14 | 5432 |

All three services are containerised and orchestrated with Docker Compose. CI builds and tests the backend and builds the frontend (with its typecheck) on every push.

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

<img src=".github/live.gif" alt="Movement simulation: a volunteer's position streams over Socket.IO along the mission route until the 'Mission complete' notification" width="100%">

<sub>Movement simulation, recorded in real time: the server streams the volunteer's position over Socket.IO (<code>locationUpdate</code>) and fires a completion event when the mission ends.</sub>

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
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Optional. MapTiler key for the satellite, terrain and dark layers; without it the map uses OpenStreetMap tiles |
