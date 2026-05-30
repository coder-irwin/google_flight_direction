import express, { Request, Response } from 'express';
import { routeCombiner } from '../services/RouteCombiner';
import { geminiIntelligenceService, AIIntelligenceResult } from '../services/intelligence/GeminiIntelligenceService';
import { pricingAggregatorService, PriceAnalyticsReport } from '../services/intelligence/PricingAggregatorService';
import { Route } from '../models';

const router = express.Router();

export interface PremiumRoute extends Route {
  aiIntelligence?: AIIntelligenceResult;
  pricingAnalytics?: PriceAnalyticsReport;
  aiRankScore?: number;
}

router.post('/routes', async (req: Request, res: Response) => {
  try {
    const { origin, destination, modes, aiQuery } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    // 1. Fetch deterministic routes from RouteCombiner
    const baseResponse = await routeCombiner.computeRoutes({
      origin,
      destination,
      modes: modes || ['flight']
    });

    if (!baseResponse.routes || baseResponse.routes.length === 0) {
      return res.json({ routes: [] });
    }

    // 2. Enhance top candidates with premium pricing aggregation & Gemini insights
    const candidateRoutes = baseResponse.routes.slice(0, 3);
    const premiumRoutes: PremiumRoute[] = await Promise.all(
      candidateRoutes.map(async (route) => {
        // Run pricing aggregation (deterministic)
        const pricingAnalytics = pricingAggregatorService.generatePriceAnalytics(route);

        // Run Gemini Intelligence reasoning (with deterministic fallbacks)
        const aiIntelligence = await geminiIntelligenceService.analyzeRoute(route);

        // Compute advanced score leveraging both layers
        let aiRankScore = pricingAnalytics.dealScore;
        if (aiIntelligence) {
          aiRankScore = Math.round((pricingAnalytics.dealScore + aiIntelligence.comfortScore - (aiIntelligence.stressScore * 0.5)) / 1.5);
        }

        // Apply dynamic query sorting overrides if conversational AI query matches intent keywords
        if (aiQuery) {
          const q = aiQuery.toLowerCase();
          if (q.includes('stress') || q.includes('comfort') || q.includes('easy')) {
            aiRankScore += aiIntelligence?.comfortScore > 80 ? 20 : -10;
          } else if (q.includes('cheap') || q.includes('budget') || q.includes('cost')) {
            aiRankScore += pricingAnalytics.dealScore > 80 ? 20 : -10;
          } else if (q.includes('sleep') || q.includes('rest') || q.includes('layover')) {
            aiRankScore += aiIntelligence?.sleepFriendlyRating === 'High' ? 20 : -10;
          }
        }

        return {
          ...route,
          aiIntelligence,
          pricingAnalytics,
          aiRankScore: Math.max(0, Math.min(100, aiRankScore))
        };
      })
    );

    // 3. Sort candidates by their computed AI Rank score
    premiumRoutes.sort((a, b) => (b.aiRankScore || 0) - (a.aiRankScore || 0));

    res.json({ routes: premiumRoutes });
  } catch (error) {
    console.error('Failed to compute premium routes:', error);
    res.status(500).json({ error: 'Failed to compute premium flight intelligence routes' });
  }
});

export default router;
