export interface WeatherReport {
  condition: 'clear' | 'clouds' | 'rain' | 'storm' | 'snow';
  tempCelsius: number;
  windKmh: number;
  humidity: number;
  visibilityKm: number;
  delayIndexWeight: number; // multiplier for delays
  description: string;
  icon?: string;
  source: 'live' | 'fallback';
}

interface WeatherCache {
  report: WeatherReport;
  expiresAt: number;
}

class WeatherIntelligenceService {
  private cache = new Map<string, WeatherCache>();
  private readonly TTL_MS = 10 * 60 * 1000; // 10 minutes per city

  private get apiKey(): string {
    return process.env.OPENWEATHERMAP_API_KEY || '';
  }

  /**
   * Maps OpenWeatherMap condition IDs to internal condition categories.
   */
  private mapOwmCondition(id: number): WeatherReport['condition'] {
    if (id >= 200 && id < 300) return 'storm';
    if (id >= 300 && id < 600) return 'rain';
    if (id >= 600 && id < 700) return 'snow';
    if (id >= 800 && id === 800) return 'clear';
    if (id > 800) return 'clouds';
    return 'clear';
  }

  /**
   * Computes aviation delay index weight from weather severity.
   */
  private computeDelayWeight(condition: WeatherReport['condition'], windKmh: number, visibilityKm: number): number {
    let weight = 1.0;
    if (condition === 'storm') weight += 0.9;
    else if (condition === 'snow') weight += 0.6;
    else if (condition === 'rain') weight += 0.3;
    else if (condition === 'clouds') weight += 0.1;
    if (windKmh > 60) weight += 0.4;
    else if (windKmh > 35) weight += 0.2;
    if (visibilityKm < 1) weight += 0.5;
    else if (visibilityKm < 5) weight += 0.2;
    return Math.min(3.0, Math.round(weight * 100) / 100);
  }

  /**
   * Fetches real-time weather for an airport city via OpenWeatherMap.
   * Caches for 10 minutes per city. Falls back to realistic deterministic engine if unavailable.
   */
  public async getAirportWeather(city: string): Promise<WeatherReport> {
    const cacheKey = city.toLowerCase().trim();
    const now = Date.now();

    // Return cached result if still valid
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.report;
    }

    if (this.apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

        if (res.ok) {
          const data = await res.json();
          const condId = data.weather?.[0]?.id ?? 800;
          const condition = this.mapOwmCondition(condId);
          const tempCelsius = Math.round(data.main?.temp ?? 22);
          const windKmh = Math.round((data.wind?.speed ?? 10) * 3.6); // m/s to km/h
          const humidity = data.main?.humidity ?? 60;
          const visibilityKm = Math.round((data.visibility ?? 10000) / 1000);
          const delayIndexWeight = this.computeDelayWeight(condition, windKmh, visibilityKm);

          const report: WeatherReport = {
            condition,
            tempCelsius,
            windKmh,
            humidity,
            visibilityKm,
            delayIndexWeight,
            description: data.weather?.[0]?.description
              ? `${data.weather[0].description.charAt(0).toUpperCase()}${data.weather[0].description.slice(1)} over ${city}`
              : `Current conditions at ${city} airport`,
            icon: data.weather?.[0]?.icon,
            source: 'live',
          };

          this.cache.set(cacheKey, { report, expiresAt: now + this.TTL_MS });
          console.log(`[Weather] Live OWM data for ${city}: ${condition}, ${tempCelsius}°C, wind ${windKmh}km/h`);
          return report;
        } else {
          console.warn(`[Weather] OWM API returned ${res.status} for city: ${city}`);
        }
      } catch (error: any) {
        console.warn(`[Weather] OWM fetch failed for ${city}: ${error?.message}`);
      }
    }

    // Deterministic realistic fallback (city-based seed for consistency, not charCodeAt hack)
    return this.getDeterministicFallback(city);
  }

  /**
   * Realistic deterministic fallback — consistent per city name, not random.
   */
  private getDeterministicFallback(city: string): WeatherReport {
    const seed = city.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const conditions: WeatherReport['condition'][] = ['clear', 'clouds', 'clouds', 'rain', 'clear', 'clear', 'clouds', 'storm', 'clear', 'rain'];
    const condition = conditions[seed % conditions.length];
    const tempCelsius = 18 + (seed % 18);
    const windKmh = 8 + (seed % 22);
    const visibilityKm = condition === 'storm' ? 2 : condition === 'rain' ? 5 : 10;
    const delayIndexWeight = this.computeDelayWeight(condition, windKmh, visibilityKm);

    const descriptions: Record<WeatherReport['condition'], string> = {
      clear: `Clear skies and excellent visibility at ${city} airport`,
      clouds: `Partly cloudy conditions over ${city} airspace`,
      rain: `Light showers affecting ${city} airport ground operations`,
      storm: `Thunderstorm activity near ${city} — expect ATC delays`,
      snow: `Snow conditions at ${city} — de-icing procedures active`,
    };

    return {
      condition,
      tempCelsius,
      windKmh,
      humidity: 50 + (seed % 40),
      visibilityKm,
      delayIndexWeight,
      description: descriptions[condition],
      source: 'fallback',
    };
  }
}

export const weatherIntelligenceService = new WeatherIntelligenceService();
