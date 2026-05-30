import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { Airport, Location } from '../models';
import { getDistanceFromLatLonInKm } from '../utils/geo';

class AirportService {
  private airports: Airport[] = [];

  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const dataPath = path.join(__dirname, '../../data/airports.dat');
      const results: Airport[] = [];

      fs.createReadStream(dataPath)
        .pipe(parse({ delimiter: ',', relax_quotes: true, escape: '\\', cast: true }))
        .on('data', (row) => {
          // OpenFlights format: ID, Name, City, Country, IATA, ICAO, Lat, Lng, ...
          const iata = row[4];
          if (iata && iata !== '\\N' && iata.length === 3) {
            results.push({
              iata: iata as string,
              name: row[1] as string,
              city: row[2] as string,
              country: row[3] as string,
              location: {
                lat: parseFloat(row[6]),
                lng: parseFloat(row[7]),
              },
            });
          }
        })
        .on('end', () => {
          this.airports = results;
          console.log(`Loaded ${this.airports.length} valid IATA airports.`);
          resolve();
        })
        .on('error', (error) => {
          console.error('Failed to parse airports.dat', error);
          reject(error);
        });
    });
  }

  public getNearestAirports(loc: Location, limit: number = 3): Airport[] {
    const sorted = [...this.airports].sort((a, b) => {
      const distA = getDistanceFromLatLonInKm(loc.lat, loc.lng, a.location.lat, a.location.lng);
      const distB = getDistanceFromLatLonInKm(loc.lat, loc.lng, b.location.lat, b.location.lng);
      return distA - distB;
    });

    return sorted.slice(0, limit);
  }

  public getAirportByIata(iata: string): Airport | undefined {
    return this.airports.find(a => a.iata === iata);
  }

  public searchAirports(query: string, limit: number = 5): Airport[] {
    try {
      if (!this.airports || !Array.isArray(this.airports)) {
        console.warn('this.airports is not initialized or is not an array.');
        return [];
      }
      const q = (query || '').toLowerCase();
      return this.airports
        .filter(a => {
          if (!a) return false;
          const iataMatch = a.iata && typeof a.iata === 'string' && a.iata.toLowerCase().includes(q);
          const nameMatch = a.name && typeof a.name === 'string' && a.name.toLowerCase().includes(q);
          const cityMatch = a.city && typeof a.city === 'string' && a.city.toLowerCase().includes(q);
          return !!(iataMatch || nameMatch || cityMatch);
        })
        .slice(0, limit);
    } catch (err) {
      console.error('searchAirports encountered an error:', err);
      return [];
    }
  }
}

export const airportService = new AirportService();
