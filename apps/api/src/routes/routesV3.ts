import express, { Request, Response } from 'express';
import { routeGraphEngine } from '../services/open_aviation/RouteGraphEngine';
import { openSkyTrackerService } from '../services/open_aviation/OpenSkyTrackerService';
import { weatherIntelligenceService, WeatherReport } from '../services/open_aviation/WeatherIntelligenceService';
import { geminiIntelligenceService, AIIntelligenceResult } from '../services/intelligence/GeminiIntelligenceService';
import { pricingAggregatorService, PriceAnalyticsReport } from '../services/intelligence/PricingAggregatorService';
import { Route } from '../models';

const router = express.Router();

export interface EnrichedV3Route extends Route {
  aiIntelligence?: AIIntelligenceResult;
  pricingAnalytics?: PriceAnalyticsReport;
  weatherReport?: WeatherReport;
  aiRankScore?: number;
}

// 1. Core Routing Endpoint solving connectivity with OpenFlights + OurAirports
router.post('/routes', async (req: Request, res: Response) => {
  try {
    const { origin, destination, aiQuery } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    // Solve routing connectivity graph
    const solvedRoutes = await routeGraphEngine.computeDijkstraRoutes(origin, destination);
    
    if (solvedRoutes.length === 0) {
      return res.json({ routes: [] });
    }

    // Enrich solved routes with weather warnings & Gemini Pro insights
    const enrichedRoutes: EnrichedV3Route[] = await Promise.all(
      solvedRoutes.map(async (route) => {
        const flightSegment = route.segments.find(s => s.type === 'flight');
        const flightCity = flightSegment?.destination || 'Delhi';

        // Fetch Live Weather Delays (GCP Cloud scale)
        const weatherReport = await weatherIntelligenceService.getAirportWeather(flightCity);

        // Fetch Pricing tiers
        const pricingAnalytics = pricingAggregatorService.generatePriceAnalytics(route);

        // Fetch Flagship Pro AI intelligence reasoning
        const aiIntelligence = await geminiIntelligenceService.analyzeRoute(route);

        // Adjust rank scores taking weather warnings into account
        let aiRankScore = pricingAnalytics.dealScore;
        if (aiIntelligence) {
          aiRankScore = Math.round((pricingAnalytics.dealScore + aiIntelligence.comfortScore - (aiIntelligence.stressScore * 0.4)) / 1.5);
        }

        // Apply weather delay coefficients to final stress meters
        if (weatherReport.delayIndexWeight > 1.2 && aiIntelligence) {
          aiIntelligence.stressScore = Math.min(99, aiIntelligence.stressScore + 20);
          aiIntelligence.terminalAlert = `⚠️ Delay Alert: ${weatherReport.description}`;
        }

        return {
          ...route,
          aiIntelligence,
          pricingAnalytics,
          weatherReport,
          aiRankScore: Math.max(0, Math.min(100, aiRankScore))
        };
      })
    );

    // Sort candidates by finalized AI scores
    enrichedRoutes.sort((a, b) => (b.aiRankScore || 0) - (a.aiRankScore || 0));

    res.json({ routes: enrichedRoutes });
  } catch (error) {
    console.error('Failed to compute V3 premium route:', error);
    res.status(500).json({ error: 'Failed to compute V3 Premium flight paths' });
  }
});

// 2. OpenSky Network Air Traffic Endpoint
router.get('/traffic', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 20.5937;
    const lng = parseFloat(req.query.lng as string) || 78.9629;
    
    const traffic = await openSkyTrackerService.getAirTrafficNear({ lat, lng }, 500);
    res.json({ traffic });
  } catch (error) {
    console.error('Failed to poll live air traffic:', error);
    res.status(500).json({ error: 'Failed to poll live air traffic streams' });
  }
});

export default router;
