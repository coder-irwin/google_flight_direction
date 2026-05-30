export type RouteMode = 'walk' | 'bike' | 'car' | 'bus' | 'train' | 'metro' | 'flight';
export interface Location {
    lat: number;
    lng: number;
}
export interface Airport {
    iata: string;
    name: string;
    city: string;
    country: string;
    location: Location;
}
export interface RouteSegment {
    type: 'commute' | 'flight';
    mode: RouteMode;
    origin: string;
    destination: string;
    durationText: string;
    durationValue: number;
    distanceText?: string;
    distanceValue?: number;
    airline?: string;
    flightNumber?: string;
    priceEstimate?: number;
}
export interface Route {
    mode: RouteMode;
    totalDurationText: string;
    totalDurationValue: number;
    totalCostEstimate?: number;
    segments: RouteSegment[];
}
export interface RouteRequest {
    origin: string;
    destination: string;
    modes: RouteMode[];
}
export interface RouteResponse {
    routes: Route[];
}
//# sourceMappingURL=index.d.ts.map