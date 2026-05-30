import { Client, GeocodeResponse, DirectionsResponse, TravelMode } from '@googlemaps/google-maps-services-js';
import { Location } from '../models';

class MapsService {
  private client: Client;

  constructor() {
    this.client = new Client({});
  }

  private get key(): string {
    return process.env.GOOGLE_MAPS_API_KEY || '';
  }

  public async geocode(address: string): Promise<Location | null> {
    if (!this.key) throw new Error('GOOGLE_MAPS_API_KEY is not set');

    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.key,
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        return { lat, lng };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  public async getDirections(origin: string, destination: string, mode: TravelMode = TravelMode.driving) {
    if (!this.key) throw new Error('GOOGLE_MAPS_API_KEY is not set');

    try {
      const response = await this.client.directions({
        params: {
          origin,
          destination,
          mode,
          key: this.key,
        }
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const leg = response.data.routes[0].legs[0];
        if (!leg) return null;
        return {
          durationText: leg.duration?.text || '',
          durationValue: leg.duration?.value || 0,
          distanceText: leg.distance?.text || '',
          distanceValue: leg.distance?.value || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Directions error:', error);
      return null;
    }
  }
}

export const mapsService = new MapsService();
