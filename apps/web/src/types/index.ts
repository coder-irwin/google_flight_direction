export type RouteMode = 'walk' | 'bike' | 'car' | 'bus' | 'train' | 'metro' | 'flight';

export interface Location {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  type: 'commute' | 'flight';
  mode: RouteMode;
  origin: string;
  destination: string;
  startLocation?: Location;
  endLocation?: Location;
  durationText: string;
  durationValue: number;
  distanceText?: string;
  distanceValue?: number;
  airline?: string;
  flightNumber?: string;
  priceEstimate?: number;
  departureTime?: string; // HH:MM format
}

export interface Route {
  mode: RouteMode;
  totalDurationText: string;
  totalDurationValue: number;
  totalCostEstimate?: number;
  segments: RouteSegment[];
  weatherReport?: {
    condition: string;
    tempCelsius: number;
    windKmh: number;
    humidity?: number;
    visibilityKm?: number;
    delayIndexWeight: number;
    description: string;
    source?: 'live' | 'fallback';
  };
  aiIntelligence?: {
    comfortScore: number;
    stressScore: number;
    sleepFriendlyRating: 'High' | 'Medium' | 'Low';
    loungeTip: string;
    terminalAlert: string;
    customInsight: string;
    reasoningBrief: string;
    aiRankLabel: string;
  };
  pricingAnalytics?: {
    dealScore: number;
    cheapestTier: {
      carrierType: 'low-cost' | 'standard' | 'premium';
      airline: string;
      basePrice: number;
      baggageFee: number;
      seatSelectionFee: number;
      mealIncluded: boolean;
      totalEstimatedCost: number;
      amenities: string[];
    };
    premiumTier: {
      carrierType: 'low-cost' | 'standard' | 'premium';
      airline: string;
      basePrice: number;
      baggageFee: number;
      seatSelectionFee: number;
      mealIncluded: boolean;
      totalEstimatedCost: number;
      amenities: string[];
    };
    priceTrend: 'rising' | 'falling' | 'stable';
    loungeAvailability: {
      hasLounge: boolean;
      loungeName?: string;
      entryCost?: number;
    };
  };
  aiRankScore?: number;
}

export interface RouteResponse {
  routes: Route[];
}
