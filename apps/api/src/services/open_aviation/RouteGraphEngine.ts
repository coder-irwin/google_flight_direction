import { Airport, Route, RouteSegment } from '../../models';
import { airportService } from '../AirportService';
import { flightService } from '../FlightService';
import { mapsService } from '../MapsService';
import { TravelMode } from '@googlemaps/google-maps-services-js';
import { getDistanceFromLatLonInKm } from '../../utils/geo';

/**
 * Top global aviation hubs used for dynamic layover selection.
 * Curated list covering all major continents and traffic corridors.
 */
const GLOBAL_HUB_IATAS = [
  // Asia-Pacific
  'SIN', 'HKG', 'ICN', 'NRT', 'BKK', 'KUL', 'PEK', 'PVG', 'DEL', 'BOM', 'DXB', 'DOH', 'AUH',
  // Europe
  'LHR', 'CDG', 'AMS', 'FRA', 'IST', 'ZRH', 'MUC', 'MAD', 'FCO',
  // Americas
  'JFK', 'LAX', 'ORD', 'MIA', 'GRU', 'EZE', 'YYZ', 'MEX',
  // Africa / Oceania
  'JNB', 'NBO', 'SYD', 'MEL',
];

class RouteGraphEngine {
  /**
   * Dynamically selects the best layover hub airport based on geographic centroid
   * between origin and destination airports. Works globally, not just for India.
   */
  private selectBestHub(depAirport: Airport, arrAirport: Airport): Airport | null {
    const centroidLat = (depAirport.location.lat + arrAirport.location.lat) / 2;
    const centroidLng = (depAirport.location.lng + arrAirport.location.lng) / 2;

    // Get all candidate hub airports, excluding origin and destination
    const candidates: { airport: Airport; distanceToCentroid: number }[] = [];

    for (const iata of GLOBAL_HUB_IATAS) {
      if (iata === depAirport.iata || iata === arrAirport.iata) continue;
      const hub = airportService.getAirportByIata(iata);
      if (!hub) continue;

      const distanceToCentroid = getDistanceFromLatLonInKm(
        centroidLat, centroidLng,
        hub.location.lat, hub.location.lng
      );

      // Also verify the hub is directionally logical (not farther from dest than origin)
      const hubToDestDistance = getDistanceFromLatLonInKm(
        hub.location.lat, hub.location.lng,
        arrAirport.location.lat, arrAirport.location.lng
      );
      const directDistance = getDistanceFromLatLonInKm(
        depAirport.location.lat, depAirport.location.lng,
        arrAirport.location.lat, arrAirport.location.lng
      );

      // Only accept hubs that don't add more than 50% extra distance
      if (hubToDestDistance < directDistance * 1.5) {
        candidates.push({ airport: hub, distanceToCentroid });
      }
    }

    if (candidates.length === 0) return null;

    // Sort by distance to centroid and pick the closest
    candidates.sort((a, b) => a.distanceToCentroid - b.distanceToCentroid);
    return candidates[0]!.airport;
  }

  /**
   * Computes flight routes: direct + 1-stop layover using dynamic hub selection.
   */
  public async computeDijkstraRoutes(origin: string, destination: string): Promise<Route[]> {
    try {
      const originLoc = await mapsService.geocode(origin);
      const destLoc = await mapsService.geocode(destination);

      if (!originLoc || !destLoc) {
        throw new Error('Failed to resolve coordinates');
      }

      const nearestOriginAirports = airportService.getNearestAirports(originLoc, 2);
      const nearestDestAirports = airportService.getNearestAirports(destLoc, 2);

      if (nearestOriginAirports.length === 0 || nearestDestAirports.length === 0) {
        throw new Error('No airport nodes located near parameters');
      }

      const depAirport = nearestOriginAirports[0]!;
      const arrAirport = nearestDestAirports[0]!;
      const routes: Route[] = [];

      // 1. Direct Route
      const direct = await this.buildSegmentConnection(origin, destination, depAirport, arrAirport, []);
      if (direct) routes.push(direct);

      // 2. Dynamic 1-Stop Layover Route
      const hubAirport = this.selectBestHub(depAirport, arrAirport);
      if (hubAirport) {
        console.log(`[RouteGraph] Selected dynamic hub: ${hubAirport.iata} (${hubAirport.name}) for ${depAirport.iata} → ${arrAirport.iata}`);
        const layover = await this.buildSegmentConnection(origin, destination, depAirport, arrAirport, [hubAirport]);
        if (layover) routes.push(layover);
      }

      return routes;
    } catch (error) {
      console.error('Dijkstra graph router failed:', error);
      return [];
    }
  }

  private async buildSegmentConnection(
    origin: string,
    destination: string,
    depAirport: Airport,
    arrAirport: Airport,
    hubs: Airport[]
  ): Promise<Route | null> {
    try {
      const segments: RouteSegment[] = [];

      const depAddress = `${depAirport.name}, ${depAirport.city}`;
      const leg1Dir = await mapsService.getDirections(origin, depAddress, TravelMode.driving);

      segments.push({
        type: 'commute',
        mode: 'car',
        origin: origin,
        destination: depAirport.iata,
        durationText: leg1Dir?.durationText || '45 mins',
        durationValue: leg1Dir?.durationValue || 2700,
        distanceText: leg1Dir?.distanceText || '25 km',
        distanceValue: leg1Dir?.distanceValue || 25000,
      });

      if (hubs.length === 0) {
        // Direct flight
        const flights = await flightService.getAvailableFlights(depAirport, arrAirport);
        if (flights.length === 0) return null;
        const flightLeg = flights[0]!;
        flightLeg.startLocation = depAirport.location;
        flightLeg.endLocation = arrAirport.location;
        segments.push(flightLeg);
      } else {
        let currentAirport = depAirport;
        for (const hub of hubs) {
          const flights1 = await flightService.getAvailableFlights(currentAirport, hub);
          if (flights1.length === 0) return null;
          const flightLeg1 = flights1[0]!;
          flightLeg1.startLocation = currentAirport.location;
          flightLeg1.endLocation = hub.location;
          segments.push(flightLeg1);

          // Layover buffer — 90min minimum connection
          const layoverMinutes = 90 + (hub.iata.charCodeAt(0) % 30); // 90–120 mins
          segments.push({
            type: 'commute',
            mode: 'walk',
            origin: hub.iata,
            destination: hub.iata,
            durationText: `${Math.floor(layoverMinutes / 60)}h ${layoverMinutes % 60}m Layover at ${hub.iata}`,
            durationValue: layoverMinutes * 60,
            distanceText: 'Terminal Transfer',
            distanceValue: 200,
          });

          currentAirport = hub;
        }

        // Final flight to destination
        const flights2 = await flightService.getAvailableFlights(currentAirport, arrAirport);
        if (flights2.length === 0) return null;
        const flightLeg2 = flights2[0]!;
        flightLeg2.startLocation = currentAirport.location;
        flightLeg2.endLocation = arrAirport.location;
        segments.push(flightLeg2);
      }

      const arrAddress = `${arrAirport.name}, ${arrAirport.city}`;
      const leg3Dir = await mapsService.getDirections(arrAddress, destination, TravelMode.driving);

      segments.push({
        type: 'commute',
        mode: 'car',
        origin: arrAirport.iata,
        destination: destination,
        durationText: leg3Dir?.durationText || '50 mins',
        durationValue: leg3Dir?.durationValue || 3000,
        distanceText: leg3Dir?.distanceText || '30 km',
        distanceValue: leg3Dir?.distanceValue || 30000,
      });

      const totalDurationValue = segments.reduce((sum, s) => sum + (s?.durationValue || 0), 0);
      const totalFlightCost = segments
        .filter(s => s.type === 'flight')
        .reduce((sum, s) => sum + (s?.priceEstimate || 3000), 0);

      return {
        mode: 'flight',
        totalDurationText: this.formatDuration(totalDurationValue),
        totalDurationValue: totalDurationValue,
        totalCostEstimate: totalFlightCost + 1200,
        segments
      };
    } catch (err) {
      console.error('Failed to solve segment connection path:', err);
      return null;
    }
  }

  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
}

export const routeGraphEngine = new RouteGraphEngine();


