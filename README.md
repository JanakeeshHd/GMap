# GMap AI - AI Powered Road Trip Planner

Modern full-stack web app for intelligent road trip planning with a futuristic 3D UI, LLM-backed planning, route optimization, and travel assistance.

## Core Highlights

- Premium dark UI with glassmorphism, neon glow, and micro-interactions
- 3D animated globe and motion-rich interface with Framer Motion + R3F
- AI chat planner with streaming assistant responses
- Interactive map dashboard with route overlays and trip telemetry
- Python FastAPI backend with modular AI/maps/weather services
- Redis caching and MongoDB persistence for trip plans

## Tech Stack

### Frontend

- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Three.js / React Three Fiber / Drei
- ShadCN-style reusable component patterns
- react-map-gl (Mapbox or MapLibre rendering)

### Backend

- FastAPI
- OpenAI API integration layer
- Google Maps integration layer
- Weather API integration layer
- Redis (cache)
- MongoDB (storage)

## Implemented Pages

- `/` - Landing page with 3D globe, animated gradient background, hero CTA
- `/chat` - AI chat planner with streaming responses and voice input support
- `/map` - Map dashboard with route visualization and live indicators
- `/dashboard` - Smart planner dashboard with timeline + budget tracking
- `/trip-details` - Day-wise itinerary timeline (places, stay, food, weather)
- `/profile` - Saved trips + personalized preference dashboard

## Backend APIs

### `POST /plan-trip`

Input:

```json
{
  "source": "Bangalore",
  "destination": "Goa",
  "days": 3,
  "preferences": {
    "budget": "medium",
    "interests": ["beaches", "food"],
    "transport": "car"
  }
}
```

Output:

```json
{
  "summary": "3-day scenic road trip from Bangalore to Goa.",
  "estimated_budget": 18000,
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1 journey leg",
      "activities": ["..."],
      "stay": "Top-rated nearby hotel"
    }
  ]
}
```

### `POST /optimize-route`
- Returns best route summary with stops.

### `POST /recommend-places`
- Returns AI-aware place recommendations by interests and budget.

### `GET /weather?source=...&destination=...`
- Returns route weather forecast.

### `POST /chat`
- Conversational AI endpoint.
- Supports streamed plain-text response chunks.

## Folder Structure

```text
.
├─ frontend/
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  ├─ package.json
│  └─ .env.example
├─ backend/
│  ├─ app/main.py
│  ├─ app/api/routes.py
│  ├─ app/core/config.py
│  ├─ app/models/schemas.py
│  ├─ app/services/cache_service.py
│  ├─ app/services/db_service.py
│  ├─ app/services/llm_service.py
│  ├─ app/services/maps_service.py
│  ├─ app/services/weather_service.py
│  ├─ requirements.txt
│  └─ .env.example
└─ ai/
   ├─ prompts/system_trip_planner.md
   ├─ pipelines/itinerary_pipeline.py
   └─ README.md
```

## Local Setup

## 1) Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on: `http://localhost:3000`

Required frontend env:

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000`)
- `NEXT_PUBLIC_MAPBOX_TOKEN` (optional; if missing, app uses MapLibre + public dark style)

## 2) Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend runs on: `http://localhost:8000`

Required backend env:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENAI_BASE_URL` (optional; for OpenAI-compatible providers)
- `GOOGLE_MAPS_API_KEY`
- `WEATHER_API_KEY`

## 3) Infra (Redis + MongoDB)

You can run these locally or via Docker:

- Redis on `localhost:6379`
- MongoDB on `localhost:27017`

## Frontend Quality Commands

```bash
cd frontend
npm run lint
npm run build
```

## Production Notes

- Replace fallback/mock service responses with real provider mappings.
- Add auth/session layer before multi-user deployment.
- Add PostgreSQL adapter if strict relational storage is needed.
- Use background workers for heavy itinerary generation tasks.

## Design Direction

Visual style combines:

- Apple-level polish
- Tesla dashboard UI cues
- Google Maps intelligence patterns
- Futuristic AI assistant interaction design
