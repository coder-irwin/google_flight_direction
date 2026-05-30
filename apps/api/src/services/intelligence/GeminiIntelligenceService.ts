import { GoogleGenerativeAI } from '@google/generative-ai';
import { Route } from '../../models';
import { pricingAggregatorService } from './PricingAggregatorService';

export interface AIIntelligenceResult {
  comfortScore: number;
  stressScore: number;
  sleepFriendlyRating: 'High' | 'Medium' | 'Low';
  loungeTip: string;
  terminalAlert: string;
  customInsight: string;
  reasoningBrief: string;
  aiRankLabel: string;
}

class GeminiIntelligenceService {
  private cache = new Map<string, AIIntelligenceResult>();

  private get apiKey(): string {
    return process.env.GEMINI_API_KEY || '';
  }

  /**
   * Helper to introduce a delay for exponential backoff retries.
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dynamically queries the Google Generative Language endpoints to inspect
   * which models are actively supported by the user's API key.
   */
  private async getSupportedModels(): Promise<string[]> {
    if (!this.apiKey) return [];

    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.models)) {
            const activeModels = data.models
              .filter((m: any) => {
                const name = m.name || '';
                const supportsGenerate = Array.isArray(m.supportedGenerationMethods) &&
                  m.supportedGenerationMethods.includes('generateContent');

                // Exclude legacy, embedding, experimental, or older model families
                const isLegacy = name.includes('gemini-1.0') || name.endsWith('gemini-pro') || name.includes('embedding') || name.includes('bidi') || name.includes('vision');

                return supportsGenerate && !isLegacy;
              })
              .map((m: any) => {
                const name = m.name || '';
                // Strip the 'models/' prefix for standard SDK compliance
                return name.startsWith('models/') ? name.substring(7) : name;
              });

            if (activeModels.length > 0) {
              console.log(`Dynamically discovered supported Gemini models: ${activeModels.join(', ')}`);
              return activeModels;
            }
          }
        }
      } catch (err) {
        console.warn(`Dynamic model discovery call failed for ${url}:`, err);
      }
    }

    return [];
  }

  /**
   * Safe, non-deprecated fallback model array used if dynamic list fails.
   */
  private getFallbackModels(): string[] {
    return [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-2.5-pro'
    ];
  }

  /**
   * Safe execution of content generation with retry capabilities and exponential backoff
   * for transient errors (429 Rate Limits, 503 Spikes in Demand).
   */
  private async generateWithRetryAndBackoff(
    modelInstance: any,
    prompt: string,
    maxRetries = 2,
    baseDelay = 1000
  ): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await modelInstance.generateContent(prompt);
        return response.response.text()?.trim() || '';
      } catch (error: any) {
        const errorMessage = error?.message || '';
        const isRateLimit = errorMessage.includes('429') || errorMessage.includes('Too Many Requests');
        const isServerUnavailable = errorMessage.includes('503') || errorMessage.includes('Service Unavailable') || errorMessage.includes('500');
        const isTransient = isRateLimit || isServerUnavailable;

        if (isTransient && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`Transient error calling Gemini (${errorMessage}). Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await this.wait(delay);
          continue;
        }
        throw error;
      }
    }
    throw new Error('All retries exhausted');
  }

  /**
   * Generates premium cognitive insights on top routes using dynamic model fallbacks.
   * Leverages fast, low-cost Flash models by default, and cascades to premium Pro models only on failovers.
   */
  public async analyzeRoute(route: Route): Promise<AIIntelligenceResult> {
    const defaultFallback = this.getDeterministicFallback(route);
    
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY is not set. Using deterministic AI fallback.');
      return defaultFallback;
    }

    const flightSegment = route.segments.find(s => s.type === 'flight');
    const pricing = pricingAggregatorService.generatePriceAnalytics(route);

    // Create a highly optimized, compact payload for token efficiency
    const compactPayload = {
      totalDurationMinutes: Math.round(route.totalDurationValue / 60),
      totalCost: route.totalCostEstimate || 5000,
      airline: flightSegment?.airline || 'Standard Airline',
      flightNum: flightSegment?.flightNumber || 'SL-000',
      origin: route.segments[0]?.origin,
      dest: route.segments[route.segments.length - 1]?.destination,
      dealScore: pricing.dealScore,
      priceTrend: pricing.priceTrend,
      numSegments: route.segments.length
    };

    // ---------------------------------------------------------
    // Caching layer: Avoid calling LLM for identical query layouts
    // ---------------------------------------------------------
    const cacheKey = `${compactPayload.origin}-${compactPayload.dest}-${compactPayload.numSegments}-${compactPayload.totalDurationMinutes}-${compactPayload.totalCost}`;
    if (this.cache.has(cacheKey)) {
      console.log(`Retrieving travel intelligence from in-memory cache for key: ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    // ---------------------------------------------------------
    // Fallback chain layout builder
    // ---------------------------------------------------------
    let detected = await this.getSupportedModels();
    if (detected.length === 0) {
      detected = this.getFallbackModels();
    }

    // Sort models so that Flash is tried first (default), and Pro selectively as a fallback
    const flashModels = detected.filter(name => name.toLowerCase().includes('flash'));
    const proModels = detected.filter(name => name.toLowerCase().includes('pro'));
    const otherModels = detected.filter(name => !name.toLowerCase().includes('flash') && !name.toLowerCase().includes('pro'));
    const modelsToTry = [...flashModels, ...proModels, ...otherModels];

    const systemPrompt = `You are an elite, highly visual Travel Intelligence AI.
Analyze the following compact flight route metadata.
Return a valid, parsed JSON object matching exactly this schema:
{
  "comfortScore": number (1 to 100),
  "stressScore": number (1 to 100),
  "sleepFriendlyRating": "High" | "Medium" | "Low",
  "loungeTip": "string (max 15 words about airport premium lounges or amenities)",
  "terminalAlert": "string (max 15 words connecting airports/layover/transfer risk)",
  "customInsight": "string (max 15 words reasoning why this route is best/worst for travel)",
  "reasoningBrief": "string (max 25 words explaining the AI score calculation based purely on provided inputs)",
  "aiRankLabel": "Budget Optimized" | "Least Stressful" | "Sleep-Friendly" | "Best Balance"
}
Ensure NO markdown wrappers, NO backticks, and NO trailing commas.`;

    const genAI = new GoogleGenerativeAI(this.apiKey);

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting flight analysis reasoning using model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        const promptText = `${systemPrompt}\nMetadata: ${JSON.stringify(compactPayload)}`;
        const responseText = await this.generateWithRetryAndBackoff(model, promptText);
        
        if (responseText) {
          const parsed: AIIntelligenceResult = JSON.parse(responseText);
          console.log(`Successfully completed reasoning using model: ${modelName}`);
          
          // Cache the response before returning
          this.cache.set(cacheKey, parsed);
          return parsed;
        }
      } catch (error: any) {
        console.warn(`Model ${modelName} reasoning failed or returned 404: ${error?.message || error}`);
        // Cascade to the next model in the fallback array
      }
    }

    console.warn('All Gemini models exhausted. Falling back safely to deterministic rules.');
    return defaultFallback;
  }

  /**
   * Deterministic logic used to compute insights when Gemini API is offline/unavailable.
   */
  private getDeterministicFallback(route: Route): AIIntelligenceResult {
    const totalDurationHours = route.totalDurationValue / 3600;
    const flightSegment = route.segments.find(s => s.type === 'flight');
    const isMultiLeg = route.segments.length > 3;

    let comfortScore = 80;
    let stressScore = 20;

    if (totalDurationHours > 12) {
      comfortScore -= 20;
      stressScore += 30;
    }
    if (isMultiLeg) {
      comfortScore -= 15;
      stressScore += 25;
    }

    const sleepFriendly: 'High' | 'Medium' | 'Low' = totalDurationHours > 8 && !isMultiLeg ? 'High' : totalDurationHours > 5 ? 'Medium' : 'Low';
    
    return {
      comfortScore,
      stressScore,
      sleepFriendlyRating: sleepFriendly,
      loungeTip: 'Enjoy lounge access when base tickets exceed typical budget carrier caps.',
      terminalAlert: isMultiLeg ? 'Layovers under 2 hours may require swift terminal transitions.' : 'Direct route guarantees minimal connection stress.',
      customInsight: `Saves travel complexity by connecting directly to the nearest regional airport hubs.`,
      reasoningBrief: `Calculated deterministically based on total duration of ${Math.round(totalDurationHours)}h and active segments.`,
      aiRankLabel: comfortScore > 75 ? 'Least Stressful' : 'Budget Optimized'
    };
  }
}

export const geminiIntelligenceService = new GeminiIntelligenceService();
