<p align="center">
  <img src="https://img.shields.io/badge/SkyIntel-Aviation%20Intelligence-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTIxIDE2di0ybC04LTVWM41jMC0uODMtLjY3LTEuNS0xLjUtMS41UzEwIDIuNjcgMTAgMy41VjlsLTggNXYybDgtMi41VjE5bC0yIDEuNVYyMmwzLjUtMSAzLjUgMXYtMS41TDE0IDE5di01LjVsOCAyLjV6Ii8+PC9zdmc+" alt="SkyIntel" />
</p>

<h1 align="center">✈️ SkyIntel — Aviation Intelligence Platform</h1>

<p align="center">
  <strong>Real-time aviation intelligence · AI-powered route analysis · Live air traffic radar · Weather-aware routing</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express-4.x-green?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Google%20Maps-Vector-4285F4?style=flat-square&logo=googlemaps" alt="Google Maps" />
  <img src="https://img.shields.io/badge/Gemini%20AI-Powered-8B5CF6?style=flat-square&logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/OpenSky-Live%20Tracking-34D399?style=flat-square" alt="OpenSky" />
  <img src="https://img.shields.io/badge/License-ISC-yellow?style=flat-square" alt="License" />
</p>

---

## 🧭 Overview

**SkyIntel** is a production-grade aviation intelligence and multimodal route planning platform. It combines real-time flight tracking, weather-aware routing, AI-driven travel insights, and cinematic map visualization into one unified system.

The platform is built as an **npm workspace monorepo** with two packages:

| Package | Description | Port |
|---------|-------------|------|
| `apps/api` | Express backend — routing engine, weather proxy, AI intelligence, live traffic | `:8080` |
| `apps/web` | Next.js 16 frontend — Google Vector Maps, glassmorphic UI, search panel | `:3000` |

---

## ✨ Key Features

### 🛩️ Real-Time Air Traffic
- Live aircraft positions streamed from **OpenSky Network**
- Altitude-based color classification: cruise (sky), climb (indigo), approach (amber), ground (emerald)
- Hover telemetry cards with ICAO24, heading, velocity, vertical rate
- Aircraft count badge with real-time timestamps
- 10-second polling with map-idle-first approach for performance

### 🌦️ Weather Intelligence
- Real-time weather via **OpenWeatherMap API** (proxied through backend)
- Aviation delay index computation based on conditions, wind, visibility
- Storm/rain alerts shown on route cards when `delayIndexWeight > 1.2`
- 10-minute TTL cache per city to minimize API calls
- Graceful deterministic fallback when API is unavailable

### 🤖 Gemini AI Travel Advisor
- Conversational search: _"avoid tight layovers"_, _"least stressful route"_
- Per-route comfort score, stress score, sleep-friendliness rating
- Lounge tips, terminal alerts, and custom travel insights
- Deterministic fallback when Gemini API quota is exhausted
- Token-optimized prompts — minimal cost per request

### 🗺️ Global Routing Engine
- **Dijkstra-style** path computation across 6,072 IATA airports (OpenFlights dataset)
- Dynamic centroid-based hub selection from 30+ global hub airports
- Multi-airline scheduling: IndiGo, Emirates, Singapore Airlines, BA, Lufthansa, ANA, etc.
- Short / medium / long-haul classification with tier-appropriate speed models
- Deterministic route hashing for reproducible airline/flight assignments

### 💰 Pricing Analytics
- Dual-tier comparison: cheapest (low-cost) vs. premium carrier
- Deal score computation (0–100)
- Baggage fees, seat selection, meal inclusion breakdowns
- Price trend indicators (rising / falling / stable)
- Lounge availability detection

### 🎨 Cinematic Dark UI
- Aviation-grade dark theme (`#080b14` base) with glassmorphism
- Google Vector Maps with **Cloud-based styling** via Map ID
- `AdvancedMarkerElement` — no deprecated `google.maps.Marker`
- Radar-ping, float, shimmer, fade-in-up animations
- Inter + JetBrains Mono typography

---

## 🏗️ Architecture

```
aerial-route-engine/
├── package.json                     # npm workspace root
├── apps/
│   ├── api/                         # Express backend (port 8080)
│   │   ├── Dockerfile
│   │   ├── .env                     # API keys (gitignored)
│   │   ├── data/
│   │   │   └── airports.dat         # OpenFlights airport dataset
│   │   └── src/
│   │       ├── index.ts             # Express server, CORS, rate limiting
│   │       ├── models/              # TypeScript interfaces
│   │       ├── routes/
│   │       │   ├── routesV2.ts      # Premium routes (Gemini + pricing)
│   │       │   └── routesV3.ts      # Full intelligence (weather + OpenSky + AI)
│   │       ├── services/
│   │       │   ├── AirportService.ts       # Airport search (6,072 IATA codes)
│   │       │   ├── CacheService.ts         # In-memory / Firestore cache
│   │       │   ├── FlightService.ts        # Multi-airline schedule engine
│   │       │   ├── MapsService.ts          # Google Maps Directions proxy
│   │       │   ├── RouteCombiner.ts        # V1 multimodal route combiner
│   │       │   ├── intelligence/
│   │       │   │   ├── GeminiIntelligenceService.ts   # Gemini AI reasoning
│   │       │   │   └── PricingAggregatorService.ts    # Price tier analytics
│   │       │   └── open_aviation/
│   │       │       ├── OpenSkyTrackerService.ts       # Live ADS-B traffic
│   │       │       ├── RouteGraphEngine.ts            # Dijkstra global routing
│   │       │       └── WeatherIntelligenceService.ts  # OWM weather proxy
│   │       └── utils/
│   │           └── airportMapping.ts  # IATA ↔ city resolution
│   │
│   └── web/                          # Next.js 16 frontend (port 3000)
│       ├── Dockerfile
│       ├── .env.local                # Frontend env vars (gitignored)
│       └── src/
│           ├── app/
│           │   ├── layout.tsx        # Root layout + SEO metadata
│           │   ├── page.tsx          # Main map page
│           │   └── globals.css       # Aviation dark design system
│           ├── components/
│           │   ├── SearchPanel.tsx            # Main search interface
│           │   ├── AutocompleteInput.tsx      # Airport autocomplete
│           │   ├── TransportSelector.tsx      # Mode picker
│           │   ├── RouteCard.tsx              # Route result cards
│           │   ├── RouteVisualizer.tsx        # Map polyline renderer
│           │   ├── MainMap.tsx                # Google Vector Map wrapper
│           │   ├── MapProvider.tsx            # Maps API provider
│           │   ├── LiveAirTrafficOverlay.tsx  # Real-time aircraft radar
│           │   └── premium/
│           │       ├── ConversationalSearch.tsx      # AI query input
│           │       ├── PremiumRouteVisualizer.tsx    # Advanced AdvancedMarker viz
│           │       ├── PremiumMapRenderer.tsx        # Map style config
│           │       └── PriceAnalytics.tsx            # Price tier display
│           └── types/
│               └── index.ts          # Shared TypeScript interfaces
```

---

## 📡 API Reference

### Health Check
```
GET /health
```
Returns service status and feature availability flags.

### Airport Search
```
GET /api/v1/airports/search?q=london
```
Fuzzy search across 6,072 IATA airports. Returns up to 8 results.

### Weather Proxy
```
GET /api/v1/weather/:city
```
Returns real-time weather from OpenWeatherMap (10-min cache). API key stays server-side.

**Response:**
```json
{
  "condition": "clouds",
  "tempCelsius": 27,
  "windKmh": 13,
  "humidity": 46,
  "visibilityKm": 10,
  "delayIndexWeight": 1.1,
  "description": "Overcast clouds over London",
  "source": "live"
}
```

### V1 Routes (Basic)
```
POST /api/v1/routes
Content-Type: application/json

{ "origin": "Mumbai", "destination": "London", "modes": ["flight"] }
```
Deterministic routing — no AI, no external API calls beyond Google Maps.

### V2 Routes (Premium)
```
POST /api/v2/routes
Content-Type: application/json

{ "origin": "Mumbai", "destination": "London", "modes": ["flight"], "aiQuery": "least stressful" }
```
Adds Gemini AI intelligence + pricing analytics to V1 routes.

### V3 Routes (Full Intelligence)
```
POST /api/v3/routes
Content-Type: application/json

{ "origin": "Mumbai", "destination": "London", "aiQuery": "avoid tight layovers" }
```
Full pipeline: Dijkstra routing → weather delays → Gemini reasoning → pricing → AI ranking.

### Live Air Traffic
```
GET /api/v3/traffic?lat=20.59&lng=78.96
```
Returns aircraft within ~500 km of coordinates from OpenSky Network.

---

### Rate Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Global (`/api/*`) | 120 requests | 1 minute |
| AI-heavy (`/api/v3/*`) | 20 requests | 1 minute |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Node.js | 20+ | ✅ |
| npm | 10+ | ✅ |
| Google Maps API Key | — | ✅ |
| Google Cloud Map ID | — | ✅ |
| OpenWeatherMap API Key | — | ✅ |
| Gemini API Key | — | ✅ |
| OpenSky Network credentials | — | Optional (higher rate limits) |
| GCP Project (Firestore) | — | Optional (persistent caching) |

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/aerial-route-engine.git
cd aerial-route-engine
npm install
```

### 2. Download Airport Dataset

```bash
mkdir -p apps/api/data
curl -sSL "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat" \
  -o apps/api/data/airports.dat
```

This downloads the OpenFlights dataset containing 6,072 IATA-coded airports worldwide.

### 3. Configure Environment Variables

**`apps/api/.env`**
```env
# ─── Required ───────────────────────────────────────
PORT=8080
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ─── SkyIntel Integrations ─────────────────────────
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
GEMINI_API_KEY=your_gemini_api_key

# ─── Optional: OpenSky Network (for higher rate limits) ──
OPENSKY_CLIENT_ID=your_opensky_client_id
OPENSKY_CLIENT_SECRET=your_opensky_client_secret

# ─── Optional: Firestore persistent cache ──────────
# FIRESTORE_PROJECT_ID=your_gcp_project_id
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_MAP_ID=your_google_cloud_map_id
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> **🔒 Security Note:** All sensitive API keys live in `apps/api/.env` only. The frontend never touches OpenWeatherMap, Gemini, or OpenSky credentials directly — all requests are proxied through the backend.

### 4. Obtain API Keys

| Service | Free Tier | Get Key |
|---------|-----------|---------|
| **Google Maps Platform** | $200/month credit | [console.cloud.google.com](https://console.cloud.google.com/apis) — Enable Maps JS, Directions, Places |
| **Google Cloud Map ID** | Free | [Cloud Console → Map Management](https://console.cloud.google.com/google/maps-apis/studio/maps) — Create a Map ID with Vector rendering |
| **OpenWeatherMap** | 1,000 calls/day | [openweathermap.org/api](https://openweathermap.org/api) — Sign up for free Current Weather API |
| **Gemini API** | Free tier available | [aistudio.google.com](https://aistudio.google.com/apikey) — Create API key |
| **OpenSky Network** | Unlimited (auth) | [opensky-network.org](https://opensky-network.org/index.php/login) — Register for OAuth2 credentials |

### 5. Start Development Servers

```bash
# Terminal 1 — API server
npm run dev --workspace=api

# Terminal 2 — Web frontend
npm run dev --workspace=web
```

The API starts at `http://localhost:8080` and the frontend at `http://localhost:3000`.

### 6. Verify Everything Works

```bash
# Health check — should show all features as true
curl http://localhost:8080/health

# Test airport search
curl "http://localhost:8080/api/v1/airports/search?q=tokyo"

# Test live weather
curl "http://localhost:8080/api/v1/weather/Tokyo"

# Test basic routing
curl -X POST http://localhost:8080/api/v1/routes \
  -H "Content-Type: application/json" \
  -d '{"origin": "New York", "destination": "London", "modes": ["flight"]}'
```

---

## 🐳 Docker

Both services include multi-stage Dockerfiles optimized for production.

### Build API
```bash
docker build -t skyintel-api -f apps/api/Dockerfile .
docker run -p 8080:8080 \
  -e GOOGLE_MAPS_API_KEY=xxx \
  -e OPENWEATHERMAP_API_KEY=xxx \
  -e GEMINI_API_KEY=xxx \
  skyintel-api
```

### Build Web
```bash
docker build -t skyintel-web -f apps/web/Dockerfile .
docker run -p 3000:3000 skyintel-web
```

> **Note:** The web Dockerfile uses Next.js standalone output mode. Ensure `output: 'standalone'` is set in `next.config.ts` for production builds.

---

## ☁️ Deploy to Google Cloud Run

### Deploy API
```bash
gcloud run deploy skyintel-api \
  --source ./apps/api \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_MAPS_API_KEY=YOUR_KEY,OPENWEATHERMAP_API_KEY=YOUR_KEY,GEMINI_API_KEY=YOUR_KEY,OPENSKY_CLIENT_ID=YOUR_ID,OPENSKY_CLIENT_SECRET=YOUR_SECRET"
```

### Deploy Web
After deploying the API, grab the service URL and pass it to the web deployment:

```bash
gcloud run deploy skyintel-web \
  --source ./apps/web \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_MAP_ID=YOUR_MAP_ID,NEXT_PUBLIC_API_URL=https://skyintel-api-xxxxx-uc.a.run.app"
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (Turbopack), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, custom CSS design tokens, glassmorphism |
| **Maps** | `@vis.gl/react-google-maps`, Google Vector Maps, `AdvancedMarkerElement` |
| **Icons** | Lucide React |
| **Backend** | Express 4, TypeScript, `ts-node`, `nodemon` |
| **AI** | Google Gemini via `@google/generative-ai` |
| **Maps API** | `@googlemaps/google-maps-services-js` |
| **Rate Limiting** | `express-rate-limit` |
| **Data** | OpenFlights airports dataset (6,072 IATA codes) |
| **Live Traffic** | OpenSky Network REST API (ADS-B) |
| **Weather** | OpenWeatherMap Current Weather API |
| **Caching** | In-memory `Map` / Firebase Admin (Firestore) |
| **Deployment** | Docker, Google Cloud Run |

---

## 💸 Cost Optimization

SkyIntel is designed to run on **minimal infrastructure cost**:

| Strategy | Detail |
|----------|--------|
| **Backend Proxy** | All third-party API keys stay server-side; frontend never calls external APIs directly |
| **Aggressive Caching** | Weather: 10-min TTL · Routes: hash-based dedup · AI: response caching |
| **Rate Limiting** | 120 req/min global, 20 req/min for AI-heavy V3 endpoints |
| **Deterministic Fallbacks** | Core routing works offline without Gemini/OWM — AI is an enhancement layer, not a dependency |
| **Token Optimization** | Gemini prompts are compact structured JSON; reasoning is cached to avoid repeat calls |
| **Scale to Zero** | Cloud Run scales down to 0 instances when idle — you pay nothing during downtime |
| **Free Tier APIs** | All external APIs (OpenSky, OWM, Gemini) have generous free tiers sufficient for development and small production |

---

## 📜 Scripts Reference

Run from the repository root:

```bash
# Development
npm run dev --workspace=api        # Start API with nodemon + ts-node
npm run dev --workspace=web        # Start Next.js dev server (Turbopack)

# Build
npm run build --workspace=api      # Compile TypeScript → dist/
npm run build --workspace=web      # Build Next.js production bundle

# Production
npm run start --workspace=api      # Run compiled API
npm run start --workspace=web      # Run Next.js production server

# Lint
npm run lint --workspace=web       # ESLint the frontend
```

---

## 🔐 Security

- **No API keys in frontend code** — all sensitive keys live in `apps/api/.env`
- **CORS restricted** — only `localhost:3000` and `*.run.app` origins allowed
- **Rate limiting** — prevents abuse on all API endpoints
- **Input validation** — type checking, length limits on all route inputs
- **Body size limit** — `express.json({ limit: '2mb' })` prevents payload attacks
- **`.env` files gitignored** — secrets never committed to version control

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow the existing code patterns:
- Services are singletons exported from their module
- All external API calls go through the backend (proxy pattern)
- Deterministic fallbacks for every external dependency
- Dark theme consistency for all frontend components

---

## 📄 License

ISC — see [package.json](package.json) for details.

---

<p align="center">
  Built with ❤️ by <strong>Akaash Tripathee</strong>
</p>
