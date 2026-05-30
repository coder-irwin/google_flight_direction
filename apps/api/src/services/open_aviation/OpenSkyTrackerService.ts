import { Location } from '../../models';

export interface AircraftState {
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  altitude: number; // in meters
  velocity: number; // in m/s
  heading: number; // in degrees
  verticalRate: number; // in m/s
}

class OpenSkyTrackerService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0; // Unix epoch in ms

  private get clientId(): string {
    return process.env.OPENSKY_CLIENT_ID || '';
  }

  private get clientSecret(): string {
    return process.env.OPENSKY_CLIENT_SECRET || '';
  }

  /**
   * Safe retrieval and caching of OAuth2 Access Token.
   * If credentials are not present, cascades gracefully to anonymous rate limits.
   */
  private async getAccessToken(): Promise<string | null> {
    const now = Date.now();
    
    // Return cached token if valid (with 60-second safety buffer)
    if (this.accessToken && this.tokenExpiry > now + 60000) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      console.warn('OpenSky credentials are not fully configured. Defaulting to anonymous access.');
      return null;
    }

    try {
      console.log('Fetching fresh OpenSky Network OAuth2 access token...');
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);

      const res = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Auth request failed: ${res.statusText} (${errText})`);
      }

      const data = await res.json();
      if (data && data.access_token) {
        this.accessToken = data.access_token;
        const expiresInMs = (data.expires_in || 1800) * 1000;
        this.tokenExpiry = now + expiresInMs;
        console.log('Successfully acquired OpenSky Network access token.');
        return this.accessToken;
      }
    } catch (err) {
      console.error('Failed to acquire OpenSky Network OAuth2 token:', err);
    }

    return null;
  }

  /**
   * Fetches real-time aircraft states near specific geocoded coordinates.
   * Leverages a highly scalable simulation engine if OpenSky Network API is rate-limited or offline.
   */
  public async getAirTrafficNear(loc: Location, radiusKm: number = 300): Promise<AircraftState[]> {
    try {
      // Calculate latitude/longitude bounding box based on geographical radius
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((loc.lat * Math.PI) / 180));

      const lamin = loc.lat - latDelta;
      const lamax = loc.lat + latDelta;
      const lomin = loc.lng - lngDelta;
      const lomax = loc.lng + lngDelta;

      // Get authenticated Bearer token
      const token = await this.getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `https://opensky-network.org/api/states/all?lamin=${lamin.toFixed(4)}&lomin=${lomin.toFixed(4)}&lamax=${lamax.toFixed(4)}&lomax=${lomax.toFixed(4)}`;
      console.log(`Querying real-time OpenSky air traffic with url: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.states)) {
          const aircraftStates: AircraftState[] = data.states
            .filter((state: any[]) => {
              // Ensure aircraft has valid latitude & longitude coordinate vectors
              return state && state[5] !== null && state[5] !== undefined && state[6] !== null && state[6] !== undefined;
            })
            .map((state: any[]) => ({
              icao24: state[0] || 'UNKNOWN',
              callsign: (state[1] || 'FLIGHT').trim(),
              originCountry: state[2] || 'Unknown',
              longitude: state[5],
              latitude: state[6],
              altitude: state[7] || state[13] || 0, // In meters (baro or geo altitude)
              velocity: state[9] || 0, // In m/s
              heading: Math.round(state[10] || 0), // In degrees
              verticalRate: state[11] || 0, // In m/s
            }));

          console.log(`Discovered ${aircraftStates.length} real-time aircraft state vectors via OpenSky.`);
          
          if (aircraftStates.length > 0) {
            return aircraftStates;
          }
        }
      } else {
        console.warn(`OpenSky API responded with status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to query OpenSky Network state vectors, falling back to simulated flight paths:', error);
    }

    // High-fidelity local air traffic simulation fallback for resilient visual representation
    console.log('Falling back to local high-fidelity simulated air traffic...');
    return this.getSimulatedTraffic(loc);
  }

  /**
   * Continuous dynamic flight path generator centered around coordinate hubs.
   */
  private getSimulatedTraffic(loc: Location): AircraftState[] {
    const planesCount = 15;
    const planes: AircraftState[] = [];

    for (let i = 0; i < planesCount; i++) {
      const angle = (Date.now() / 100000 + i * (Math.PI / 7)) % (2 * Math.PI);
      const radius = 0.5 + (i * 0.15); // Coordinate offset range
      
      const latitude = loc.lat + Math.sin(angle) * radius;
      const longitude = loc.lng + Math.cos(angle) * radius;
      const heading = Math.round((angle * (180 / Math.PI) + 90) % 360);

      planes.push({
        icao24: `A8F${Math.floor(1000 + i * 500).toString(16).toUpperCase()}`,
        callsign: `SL-${100 + i * 15}`,
        originCountry: i % 2 === 0 ? 'India' : 'Singapore',
        longitude,
        latitude,
        altitude: Math.round(8000 + (i * 400)), // Cruise altitude 26,000 to 35,000 feet
        velocity: Math.round(220 + (i * 10)), // Cruise speed (m/s)
        heading,
        verticalRate: i % 4 === 0 ? 2.5 : i % 4 === 1 ? -1.8 : 0
      });
    }

    return planes;
  }
}

export const openSkyTrackerService = new OpenSkyTrackerService();
