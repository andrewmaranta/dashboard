# Life RPG Dashboard - Tech Stack

Last updated: 2026-03-05

## Overview
Full-stack health/life tracking dashboard with real-time updates and modular architecture.

---

## Backend Stack

| Layer | Tech | Version |
|-------|------|---------|
| **Runtime** | Node.js | v22+ |
| **Framework** | Express | 5.2.1 |
| **Database** | SQLite (sqlite3) | 5.1.7 |
| **Real-time** | Socket.io | 4.8.3 |
| **CORS** | cors | 2.8.6 |

### API Routes
- `/api` - Health, Quests, Finance, Habits, Focus, Tasks, Blood Pressure, Beliefs
- `/api/explorer` - Data exploration
- `/api/insights` - Generated insights
- `/api/blueprint` - Life blueprint
- `/api/protocols` - Health protocols
- `/api/savoring` - Savoring insights (mastery tracking)

### Architecture Pattern
- **Single source of truth:** `data/life.db`
- Real-time push via Socket.io when data changes
- Static SPA served from `client/dist/`

---

## Frontend Stack (UI)

| Layer | Tech | Version |
|-------|------|---------|
| **Framework** | React | 18.2 |
| **Language** | TypeScript | 5.2 |
| **Build Tool** | Vite | 5.1.4 |
| **Styling** | Tailwind CSS | 3.4 |
| **Animation** | tailwindcss-animate | 1.0.7 |
| **UI Utilities** | class-variance-authority | 0.7.0 |
| **Class Utils** | clsx / tailwind-merge | 2.1.0 / 2.2.1 |
| **Icons** | Lucide React | 0.363.0 |
| **Charts** | Recharts | 3.7.0 |
| **Dates** | date-fns | 4.1.0 |
| **Real-time** | Socket.io-client | 4.8.3 |

---

## System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────┐
│   React Client  │◄────►│  Express API    │◄────►│  SQLite DB  │
│   (Vite + TS)   │  WS  │   (Port 3000)   │      │  life.db    │
└─────────────────┘      └─────────────────┘      └─────────────┘
        │
   Static build → served from client/dist/
```

### Ports
- **3000** - API server (production + static files)
- **5173** - Vite dev server (development only, requires `--host` for network access)

---

## Key Design Decisions

1. **SQLite over PostgreSQL** - Single file, zero config, perfect for personal use on Raspberry Pi
2. **Socket.io** - Real-time dashboard updates without polling
3. **Vite + React + TS** - Fast dev, type safety, modern tooling
4. **Tailwind** - Utility-first, rapid UI development
5. **Modular routes** - Each domain (health, finance, habits) has its own route file

---

## File Structure

```
health_dashboard/
├── server.js              # Express entry point
├── data/
│   └── life.db           # SQLite database
├── src/
│   ├── config.js         # App configuration
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   └── utils/            # Utilities
└── client/
    ├── src/
    │   ├── components/   # React components
    │   ├── hooks/        # Custom React hooks
    │   ├── types/        # TypeScript types
    │   └── App.tsx       # Main app component
    └── dist/             # Production build
```

---

## External Tools Integration

- **Data logging:** `tools/life-log` CLI → writes to SQLite
- **Dashboard access:** http://localhost:3000 (or Tailscale IP)
- **Dev server:** http://localhost:5173
