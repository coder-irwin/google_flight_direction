'use client';

import { useEffect, useState } from 'react';
import { useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Route } from '../../types';

interface PremiumRouteVisualizerProps {
  route: Route | null;
}

// ---------------------------------------------------------
// Helper components for modern premium Advanced Markers
// ---------------------------------------------------------

const GlowingAirportHub = ({ iata, title }: { iata: string; title: string }) => {
  const code = iata.replace(/\s*(airport|intl|international|terminal.*)/gi, '').substring(0, 3).toUpperCase();
  return (
    <div className="relative flex flex-col items-center group -translate-x-1/2 -translate-y-1/2">
      {/* Pulse Effect */}
      <div className="absolute w-12 h-12 bg-indigo-500/20 rounded-full animate-ping pointer-events-none" />
      
      {/* Glowing Airport Node */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-white/20 shadow-[0_0_15px_rgba(99,102,241,0.6)] backdrop-blur-md transition-all duration-300 group-hover:scale-110 cursor-pointer">
        <span className="text-white text-xs font-bold">✈</span>
      </div>

      {/* Glassmorphism Hub Label Card */}
      <div className="mt-1.5 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/50 text-[9px] font-bold font-mono text-indigo-300 shadow-md backdrop-blur-sm tracking-wider uppercase whitespace-nowrap">
        {code}
      </div>

      {/* Hover Intelligence Card */}
      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-50 transition-opacity duration-200">
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/95 border border-slate-800 text-xs text-slate-200 font-semibold shadow-2xl backdrop-blur-lg w-52 pointer-events-none">
          <div className="text-indigo-400 font-bold border-b border-slate-800/80 pb-1.5 mb-1.5 font-mono tracking-wide">{title}</div>
          <div className="space-y-1 text-[10px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-400 font-sans font-semibold">Active Hub • 100% OK</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span>Departure Terminal</span>
            </div>
            <div className="text-[9px] text-indigo-300/80 border-t border-slate-800/50 pt-1 mt-1 leading-normal font-sans">
              Optimized geodesic departures enabled.
            </div>
          </div>
        </div>
        {/* Card Arrow */}
        <div className="w-2.5 h-2.5 bg-slate-950/95 border-r border-b border-slate-800 rotate-45 -mt-1.5" />
      </div>
    </div>
  );
};

const GlowingDestinationHub = ({ iata, title }: { iata: string; title: string }) => {
  const code = iata.replace(/\s*(airport|intl|international|terminal.*)/gi, '').substring(0, 3).toUpperCase();
  return (
    <div className="relative flex flex-col items-center group -translate-x-1/2 -translate-y-1/2">
      {/* Pulse Effect */}
      <div className="absolute w-12 h-12 bg-pink-500/20 rounded-full animate-ping pointer-events-none" />
      
      {/* Glowing Airport Node */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-600 to-rose-600 border border-white/20 shadow-[0_0_15px_rgba(236,72,153,0.6)] backdrop-blur-md transition-all duration-300 group-hover:scale-110 cursor-pointer">
        <span className="text-white text-xs font-bold">▼</span>
      </div>

      {/* Glassmorphism Hub Label Card */}
      <div className="mt-1.5 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/50 text-[9px] font-bold font-mono text-pink-300 shadow-md backdrop-blur-sm tracking-wider uppercase whitespace-nowrap">
        {code}
      </div>

      {/* Hover Intelligence Card */}
      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-50 transition-opacity duration-200">
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/95 border border-slate-800 text-xs text-slate-200 font-semibold shadow-2xl backdrop-blur-lg w-52 pointer-events-none">
          <div className="text-pink-400 font-bold border-b border-slate-800/80 pb-1.5 mb-1.5 font-mono tracking-wide">{title}</div>
          <div className="space-y-1 text-[10px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-400 font-sans font-semibold font-mono text-[9px]">Arrival Airspace Clear</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span>Destination Terminal</span>
            </div>
            <div className="text-[9px] text-pink-300/80 border-t border-slate-800/50 pt-1 mt-1 leading-normal font-sans">
              Dynamic local arrival systems active.
            </div>
          </div>
        </div>
        {/* Card Arrow */}
        <div className="w-2.5 h-2.5 bg-slate-950/95 border-r border-b border-slate-800 rotate-45 -mt-1.5" />
      </div>
    </div>
  );
};

const LayoverIndicator = ({ iata, title, durationText }: { iata: string; title: string; durationText: string }) => {
  const code = iata.replace(/\s*(airport|intl|international|terminal.*)/gi, '').substring(0, 3).toUpperCase();
  return (
    <div className="relative flex flex-col items-center group -translate-x-1/2 -translate-y-1/2">
      {/* Pulse Effect */}
      <div className="absolute w-12 h-12 bg-amber-500/20 rounded-full animate-ping pointer-events-none" />
      
      {/* Glowing Airport Node */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 border border-white/20 shadow-[0_0_15px_rgba(245,158,11,0.6)] backdrop-blur-md transition-all duration-300 group-hover:scale-110 cursor-pointer">
        <span className="text-white text-xs font-bold">⌛</span>
      </div>

      {/* Glassmorphism Hub Label Card */}
      <div className="mt-1.5 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/50 text-[9px] font-bold font-mono text-amber-300 shadow-md backdrop-blur-sm tracking-wider uppercase whitespace-nowrap">
        {code}
      </div>

      {/* Hover Intelligence Card */}
      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-50 transition-opacity duration-200">
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/95 border border-slate-800 text-xs text-slate-200 font-semibold shadow-2xl backdrop-blur-lg w-52 pointer-events-none">
          <div className="text-amber-400 font-bold border-b border-slate-800/80 pb-1.5 mb-1.5 font-mono tracking-wide">{title}</div>
          <div className="space-y-1 text-[10px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Layover Time:</span>
              <span className="text-amber-300 font-bold font-mono">{durationText}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span>Connection Airport</span>
            </div>
            <div className="text-[9px] text-amber-300/80 border-t border-slate-800/50 pt-1 mt-1 leading-normal font-sans">
              ⚠️ Luggage self-transfer check recommended.
            </div>
          </div>
        </div>
        {/* Card Arrow */}
        <div className="w-2.5 h-2.5 bg-slate-950/95 border-r border-b border-slate-800 rotate-45 -mt-1.5" />
      </div>
    </div>
  );
};

const midpoint = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
  return {
    lat: (p1.lat + p2.lat) / 2,
    lng: (p1.lng + p2.lng) / 2,
  };
};

const calculateHeading = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

const LiveAircraftMarker = ({
  p1,
  p2,
  flightNumber,
  airline,
}: {
  p1: { lat: number; lng: number };
  p2: { lat: number; lng: number };
  flightNumber?: string;
  airline?: string;
}) => {
  const pos = midpoint(p1, p2);
  const heading = calculateHeading(p1, p2);

  return (
    <div className="relative flex flex-col items-center group -translate-x-1/2 -translate-y-1/2">
      {/* Glowing Aura */}
      <div className="absolute w-10 h-10 bg-sky-500/10 rounded-full animate-pulse pointer-events-none" />

      {/* Rotating Aircraft Container */}
      <div
        className="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-950 border border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-110 cursor-pointer"
        style={{ transform: `rotate(${heading - 45}deg)` }} // svg points NE by default
      >
        <svg
          className="w-4 h-4 text-sky-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
        </svg>
      </div>

      {/* Aircraft Telemetry Tag */}
      <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-sky-500/30 text-[8px] font-bold font-mono text-sky-300 shadow-md backdrop-blur-sm tracking-wider uppercase whitespace-nowrap">
        {flightNumber || 'FLIGHT'}
      </div>

      {/* Hover Telemetry Card */}
      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-50 transition-opacity duration-200">
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/95 border border-sky-900/50 text-xs text-slate-200 font-semibold shadow-2xl backdrop-blur-lg w-56 pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="text-sky-400 font-bold font-mono">{flightNumber || 'LIVE DATA'}</span>
            <span className="text-[8px] px-1.5 py-0.5 bg-sky-950 border border-sky-800/80 text-sky-300 rounded font-mono uppercase tracking-wider">En Route</span>
          </div>
          <div className="space-y-1 text-[10px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Carrier:</span>
              <span className="text-slate-200 font-sans font-semibold">{airline || 'Partner Carrier'}</span>
            </div>
            <div className="flex justify-between">
              <span>Heading:</span>
              <span className="text-sky-300 font-bold">{Math.round(heading)}° N</span>
            </div>
            <div className="flex justify-between">
              <span>Altitude:</span>
              <span className="text-slate-200">36,000 ft</span>
            </div>
            <div className="text-[9px] text-sky-400/80 border-t border-slate-800/50 pt-1 mt-1 leading-normal font-sans">
              Connected via real-time ADS-B exchange network feed.
            </div>
          </div>
        </div>
        {/* Card Arrow */}
        <div className="w-2.5 h-2.5 bg-slate-950/95 border-r border-b border-sky-900/50 rotate-45 -mt-1.5" />
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// Main Premium Route Visualizer Component
// ---------------------------------------------------------

export default function PremiumRouteVisualizer({ route }: PremiumRouteVisualizerProps) {
  const map = useMap();
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;
    
    // Cleanup previous drawings
    polylines.forEach(p => p.setMap(null));
    setPolylines([]);
    
    if (!route) return;

    const flightSegments = route.segments.filter(s => s.type === 'flight');
    const polylinesList: google.maps.Polyline[] = [];

    // Loop through all flight legs and draw their curved path
    flightSegments.forEach((flightSegment, idx) => {
      if (flightSegment.startLocation && flightSegment.endLocation) {
        const flightPath = [
          flightSegment.startLocation,
          flightSegment.endLocation
        ];

        const segmentPolyline = new google.maps.Polyline({
          path: flightPath,
          geodesic: true,
          strokeColor: idx === 0 ? '#6366f1' : '#ec4899', // Indigo for leg 1, Pink for leg 2!
          strokeOpacity: 0.9,
          strokeWeight: 5,
          map: map,
        });

        polylinesList.push(segmentPolyline);
      }
    });

    setPolylines(polylinesList);

    // Auto-focus map to contain all airports
    if (flightSegments.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      flightSegments.forEach(s => {
        if (s.startLocation) bounds.extend(s.startLocation);
        if (s.endLocation) bounds.extend(s.endLocation);
      });
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 450, right: 60 });
    }

    return () => {
      polylinesList.forEach(p => p.setMap(null));
    };
  }, [map, route]);

  if (!route) return null;

  const flightSegments = route.segments.filter(s => s.type === 'flight');
  if (flightSegments.length === 0) return null;

  const originSegment = flightSegments[0];
  const destSegment = flightSegments[flightSegments.length - 1];

  // Derive layover transfer points (if there are multiple legs)
  const layovers = flightSegments.slice(0, -1).map((seg, idx) => {
    const nextSeg = flightSegments[idx + 1];
    return {
      iata: seg.destination,
      title: seg.destination,
      location: seg.endLocation,
      durationText: nextSeg.durationText || '1h 30m transfer',
    };
  });

  return (
    <>
      {/* 1. Origin Airport Node */}
      {originSegment.startLocation && (
        <AdvancedMarker
          position={originSegment.startLocation}
          title={`Origin: ${originSegment.origin}`}
        >
          <GlowingAirportHub iata={originSegment.origin} title={originSegment.origin} />
        </AdvancedMarker>
      )}

      {/* 2. Destination Airport Node */}
      {destSegment.endLocation && (
        <AdvancedMarker
          position={destSegment.endLocation}
          title={`Destination: ${destSegment.destination}`}
        >
          <GlowingDestinationHub iata={destSegment.destination} title={destSegment.destination} />
        </AdvancedMarker>
      )}

      {/* 3. Layover Connections */}
      {layovers.map((layover, idx) => (
        layover.location && (
          <AdvancedMarker
            key={`layover-${idx}`}
            position={layover.location}
            title={`Layover: ${layover.title}`}
          >
            <LayoverIndicator iata={layover.iata} title={layover.title} durationText={layover.durationText} />
          </AdvancedMarker>
        )
      ))}

      {/* 4. Live Aircraft Telemetry Midpoints */}
      {flightSegments.map((segment, idx) => (
        segment.startLocation && segment.endLocation && (
          <AdvancedMarker
            key={`aircraft-${idx}`}
            position={midpoint(segment.startLocation, segment.endLocation)}
            title={`Live Flight: ${segment.flightNumber || 'FLIGHT'}`}
          >
            <LiveAircraftMarker
              p1={segment.startLocation}
              p2={segment.endLocation}
              flightNumber={segment.flightNumber}
              airline={segment.airline}
            />
          </AdvancedMarker>
        )
      ))}
    </>
  );
}
