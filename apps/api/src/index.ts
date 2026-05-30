import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { airportService } from './services/AirportService';
import { routeCombiner } from './services/RouteCombiner';
import { weatherIntelligenceService } from './services/open_aviation/WeatherIntelligenceService';
import { RouteRequest } from './models';
import routesV2 from './routes/routesV2';
import routesV3 from './routes/routesV3';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS — accept dev origins and production origins
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', /\.run\.app$/],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

// Global rate limiter: 120 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
}) as unknown as express.RequestHandler;

// Tighter limit for AI-heavy endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI route limit reached. Please wait before retrying.' },
}) as unknown as express.RequestHandler;

app.use('/api', globalLimiter);
app.use('/api/v2', routesV2);
app.use('/api/v3', aiLimiter, routesV3);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'skyintel-api',
    version: '3.0.0',
    time: new Date().toISOString(),
    features: {
      openSky: !!process.env.OPENSKY_CLIENT_ID,
      gemini: !!process.env.GEMINI_API_KEY,
      googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
      openWeather: !!process.env.OPENWEATHERMAP_API_KEY,
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'running',
    service: 'SkyIntel Aviation API',
    version: '3.0.0',
    endpoints: {
      health: 'GET /health',
      airportSearch: 'GET /api/v1/airports/search?q=...',
      routes: 'POST /api/v1/routes',
      premiumRoutes: 'POST /api/v2/routes',
      intelligentRoutes: 'POST /api/v3/routes',
      liveTraffic: 'GET /api/v3/traffic?lat=&lng=',
      weather: 'GET /api/v1/weather/:city',
    }
  });
});

// Airport search endpoint
app.get('/api/v1/airports/search', (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }
    const results = airportService.searchAirports(query, 8);
    res.json({ results });
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(500).json({ error: 'Failed to search airports' });
  }
});

// Route computation (V1 — basic)
app.post('/api/v1/routes', async (req: Request, res: Response) => {
  try {
    const payload = req.body as RouteRequest;

    if (!payload.origin || !payload.destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }
    if (typeof payload.origin !== 'string' || typeof payload.destination !== 'string') {
      return res.status(400).json({ error: 'Origin and destination must be strings' });
    }
    if (payload.origin.length > 200 || payload.destination.length > 200) {
      return res.status(400).json({ error: 'Input too long' });
    }

    const response = await routeCombiner.computeRoutes(payload);
    res.json(response);
  } catch (error) {
    console.error('Route computation error:', error);
    res.status(500).json({ error: 'Failed to compute routes' });
  }
});

// Weather proxy endpoint — keeps OWM API key server-side only
app.get('/api/v1/weather/:city', async (req: Request, res: Response) => {
  try {
    const city = req.params.city;
    if (!city || city.length > 100) {
      return res.status(400).json({ error: 'Invalid city parameter' });
    }
    const weatherReport = await weatherIntelligenceService.getAirportWeather(city);
    res.json(weatherReport);
  } catch (error) {
    console.error('Weather proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 SkyIntel API starting on port ${PORT}...`);
  try {
    await airportService.initialize();
    console.log(`✅ SkyIntel API ready on port ${PORT}`);
    console.log(`   OpenSky: ${process.env.OPENSKY_CLIENT_ID ? '✓' : '✗'}`);
    console.log(`   Gemini: ${process.env.GEMINI_API_KEY ? '✓' : '✗'}`);
    console.log(`   OpenWeather: ${process.env.OPENWEATHERMAP_API_KEY ? '✓' : '✗'}`);
  } catch (error) {
    console.error('❌ Failed to initialize services', error);
  }
});
