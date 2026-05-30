import { TravelMode } from '@googlemaps/google-maps-services-js';
import { RouteRequest, RouteResponse, Route, RouteSegment } from '../models';
import { mapsService } from './MapsService';
import { airportService } from './AirportService';
import { flightService } from './FlightService';
import { cacheService } from './CacheService';

class RouteCombiner {
  public async computeRoutes(req: RouteRequest): Promise<RouteResponse> {
    const { origin, destination, modes } = req;
    
    // Default to only flight for MVP if not specified
    const activeModes = modes.length > 0 ? modes : ['flight'];
    
    const cacheKey = Buffer.from(`${origin}|${destination}|${activeModes.join(',')}`).toString('base64');
    const cachedResponse = await cacheService.get<RouteResponse>(cacheKey, 'queries');
    if (cachedResponse) {
      console.log('Serving from cache:', cacheKey);
      return cachedResponse;
    }

    const response: RouteResponse = { routes: [] };

    if (activeModes.includes('flight')) {
      // 1. Direct Flight Route Option
      const directRoute = await this.computeFlightRoute(origin, destination, false);
      if (directRoute) {
        response.routes.push(directRoute);
      }

      // 2. Layover Flight Route Option (1-Stop Connection)
      const layoverRoute = await this.computeFlightRoute(origin, destination, true);
      if (layoverRoute) {
        response.routes.push(layoverRoute);
      }
    }

    // Cache the response for 60 minutes
    await cacheService.set(cacheKey, response, 3600, 'queries');

    return response;
  }

  private async computeFlightRoute(origin: string, destination: string, isLayover: boolean): Promise<Route | null> {
    try {
      // 1. Geocode Origin and Destination
      const originLoc = await mapsService.geocode(origin);
      const destLoc = await mapsService.geocode(destination);

      if (!originLoc || !destLoc) {
        throw new Error('Failed to geocode origin or destination');
      }

      // 2. Find nearest airports
      const nearestOriginAirports = airportService.getNearestAirports(originLoc, 1);
      const nearestDestAirports = airportService.getNearestAirports(destLoc, 1);

      if (nearestOriginAirports.length === 0 || nearestDestAirports.length === 0) {
        throw new Error('No airports found near locations');
      }

      const depAirport = nearestOriginAirports[0]!;
      const arrAirport = nearestDestAirports[0]!;

      // 3. Compute Leg 1: Commute to Departure Airport
      const depAddress = `${depAirport.name}, ${depAirport.city}`;
      const leg1Dir = await mapsService.getDirections(origin, depAddress, TravelMode.driving);

      const leg1: RouteSegment = {
        type: 'commute',
        mode: 'car',
        origin: origin,
        destination: depAirport.iata,
        durationText: leg1Dir?.durationText || '45 mins',
        durationValue: leg1Dir?.durationValue || 2700,
        distanceText: leg1Dir?.distanceText || '25 km',
        distanceValue: leg1Dir?.distanceValue || 25000,
      };

      const segments: RouteSegment[] = [leg1];

      // 4. Compute Flight Legs
      if (!isLayover) {
        // Direct flight
        const flights = await flightService.getAvailableFlights(depAirport, arrAirport);
        if (flights.length === 0) throw new Error('No flights available');
        const leg2 = flights[0]!;
        leg2.startLocation = depAirport.location;
        leg2.endLocation = arrAirport.location;
        segments.push(leg2);
      } else {
        // Layover Flight Option (e.g. transfer via a major hub like Mumbai BOM or Delhi DEL)
        const hubIata = depAirport.iata === 'BOM' || arrAirport.iata === 'BOM' ? 'DEL' : 'BOM';
        const hubAirport = airportService.getAirportByIata(hubIata) || depAirport;

        // Flight 1: Departure to Hub
        const flights1 = await flightService.getAvailableFlights(depAirport, hubAirport);
        if (flights1.length === 0) throw new Error('No layover hub flights available');
        const flightSegment1 = flights1[0]!;
        flightSegment1.startLocation = depAirport.location;
        flightSegment1.endLocation = hubAirport.location;
        flightSegment1.airline = 'Air India (1-Stop Link)';
        flightSegment1.flightNumber = 'AI-4820';
        segments.push(flightSegment1);

        // Layover transition segment (mock commute representing layover buffer time)
        const layoverBuffer: RouteSegment = {
          type: 'commute',
          mode: 'walk',
          origin: hubAirport.iata,
          destination: hubAirport.iata,
          durationText: '1h 30m Layover',
          durationValue: 5400,
          distanceText: 'Terminal Transfer',
          distanceValue: 200,
        };
        segments.push(layoverBuffer);

        // Flight 2: Hub to Arrival
        const flights2 = await flightService.getAvailableFlights(hubAirport, arrAirport);
        if (flights2.length === 0) throw new Error('No layover second leg flights available');
        const flightSegment2 = flights2[0]!;
        flightSegment2.startLocation = hubAirport.location;
        flightSegment2.endLocation = arrAirport.location;
        flightSegment2.airline = 'Indigo (1-Stop Link)';
        flightSegment2.flightNumber = '6E-5912';
        segments.push(flightSegment2);
      }

      // 5. Compute Leg 3: Commute to Destination
      const arrAddress = `${arrAirport.name}, ${arrAirport.city}`;
      const leg3Dir = await mapsService.getDirections(arrAddress, destination, TravelMode.driving);

      const leg3: RouteSegment = {
        type: 'commute',
        mode: 'car',
        origin: arrAirport.iata,
        destination: destination,
        durationText: leg3Dir?.durationText || '50 mins',
        durationValue: leg3Dir?.durationValue || 3000,
        distanceText: leg3Dir?.distanceText || '30 km',
        distanceValue: leg3Dir?.distanceValue || 30000,
      };

      segments.push(leg3);

      const totalDurationValue = segments.reduce((sum, s) => sum + (s?.durationValue || 0), 0);
      const totalFlightCost = segments
        .filter(s => s.type === 'flight')
        .reduce((sum, s) => sum + (s?.priceEstimate || 3000), 0);

      const route: Route = {
        mode: 'flight',
        totalDurationText: this.formatDuration(totalDurationValue),
        totalDurationValue: totalDurationValue,
        totalCostEstimate: totalFlightCost + 1000, // flight cost + approx commute fees
        segments: segments,
      };

      return route;
    } catch (error) {
      console.error('Error computing flight route:', error);
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

export const routeCombiner = new RouteCombiner();
