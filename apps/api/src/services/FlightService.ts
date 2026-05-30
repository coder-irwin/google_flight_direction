import { Airport, RouteSegment } from '../models';
import { getDistanceFromLatLonInKm } from '../utils/geo';

/**
 * Multi-airline schedule pools by geographic region.
 * Deterministic — no random() calls. Airline selection based on route distance hash.
 */
const AIRLINE_POOLS = {
  shortHaul: [ // < 1500km
    { code: '6E', name: 'IndiGo' },
    { code: 'SG', name: 'SpiceJet' },
    { code: 'UK', name: 'Vistara' },
    { code: 'G8', name: 'Go First' },
    { code: 'FR', name: 'Ryanair' },
    { code: 'W6', name: 'Wizz Air' },
  ],
  mediumHaul: [ // 1500–5000km
    { code: 'AI', name: 'Air India' },
    { code: 'EK', name: 'Emirates' },
    { code: 'QR', name: 'Qatar Airways' },
    { code: 'EY', name: 'Etihad Airways' },
    { code: 'TK', name: 'Turkish Airlines' },
    { code: 'LH', name: 'Lufthansa' },
  ],
  longHaul: [ // > 5000km
    { code: 'SQ', name: 'Singapore Airlines' },
    { code: 'CX', name: 'Cathay Pacific' },
    { code: 'BA', name: 'British Airways' },
    { code: 'AF', name: 'Air France' },
    { code: 'UA', name: 'United Airlines' },
    { code: 'AA', name: 'American Airlines' },
  ],
};

/**
 * Departure time banks (hour of day): morning, afternoon, evening departures.
 */
const DEPARTURE_BANKS = [6, 9, 12, 15, 18, 21];

class FlightService {
  /**
   * Returns a realistic multi-airline flight schedule for a route.
   * Deterministic per airport pair — consistent results for same origin/destination.
   */
  public async getAvailableFlights(originAirport: Airport, destAirport: Airport): Promise<RouteSegment[]> {
    const distanceKm = getDistanceFromLatLonInKm(
      originAirport.location.lat,
      originAirport.location.lng,
      destAirport.location.lat,
      destAirport.location.lng
    );

    // Flight duration: distance / avg speed + taxi/climb time
    const avgSpeedKmh = distanceKm < 1500 ? 750 : distanceKm < 5000 ? 820 : 880;
    const flightHours = distanceKm / avgSpeedKmh;
    const durationSeconds = Math.round(flightHours * 3600) + 2400; // + 40min taxi/climb

    // Deterministic airline selection based on route hash
    const routeHash = this.hashRoute(originAirport.iata, destAirport.iata);
    const pool =
      distanceKm < 1500 ? AIRLINE_POOLS.shortHaul :
      distanceKm < 5000 ? AIRLINE_POOLS.mediumHaul :
      AIRLINE_POOLS.longHaul;

    const airline = pool[routeHash % pool.length]!;
    const flightNumSuffix = 100 + (routeHash % 8900); // 100–8999
    const flightNumber = `${airline.code}${flightNumSuffix}`;

    // Deterministic departure time (based on route hash → pick from departure bank)
    const departureHour = DEPARTURE_BANKS[routeHash % DEPARTURE_BANKS.length]!;
    const departureMinute = (routeHash % 4) * 15; // 0, 15, 30, or 45 min

    // Price: base fare + per-km factor + carrier tier premium
    const baseFare = distanceKm < 1500 ? 2500 : distanceKm < 5000 ? 8000 : 35000;
    const perKmRate = distanceKm < 1500 ? 1.8 : distanceKm < 5000 ? 2.2 : 4.5;
    const tierMultiplier = pool === AIRLINE_POOLS.longHaul ? 1.3 : 1.0;
    const priceEstimate = Math.round((baseFare + distanceKm * perKmRate) * tierMultiplier);

    const flight: RouteSegment = {
      type: 'flight',
      mode: 'flight',
      origin: originAirport.iata,
      destination: destAirport.iata,
      durationText: this.formatDuration(durationSeconds),
      durationValue: durationSeconds,
      distanceText: `${Math.round(distanceKm).toLocaleString()} km`,
      distanceValue: Math.round(distanceKm * 1000),
      airline: airline.name,
      flightNumber: flightNumber,
      priceEstimate: priceEstimate,
      departureTime: `${String(departureHour).padStart(2, '0')}:${String(departureMinute).padStart(2, '0')}`,
    };

    return [flight];
  }

  /**
   * Deterministic hash for a route pair. Same O/D always returns same number.
   */
  private hashRoute(iata1: string, iata2: string): number {
    const str = `${iata1}:${iata2}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
}

export const flightService = new FlightService();

