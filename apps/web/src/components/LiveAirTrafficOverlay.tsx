'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMap, AdvancedMarker } from '@vis.gl/react-google-maps';

export interface AircraftState {
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  verticalRate: number;
}

/** Altitude-based color classification for visual radar differentiation */
const getAltitudeProfile = (altitudeM: number) => {
  const altFt = altitudeM * 3.281;
  if (altFt > 30000) return { ring: 'bg-sky-500/15', dot: 'bg-sky-900 border-sky-400', icon: 'text-sky-300', label: 'text-sky-400', phase: 'Cruise' };
  if (altFt > 10000) return { ring: 'bg-indigo-500/15', dot: 'bg-indigo-900 border-indigo-400', icon: 'text-indigo-300', label: 'text-indigo-400', phase: 'Climb' };
  if (altFt > 3000) return { ring: 'bg-amber-500/15', dot: 'bg-amber-900 border-amber-400', icon: 'text-amber-300', label: 'text-amber-400', phase: 'Approach' };
  return { ring: 'bg-emerald-500/15', dot: 'bg-emerald-900 border-emerald-400', icon: 'text-emerald-300', label: 'text-emerald-400', phase: 'Ground' };
};

interface AircraftMarkerProps {
  plane: AircraftState;
}

function AircraftMarker({ plane }: AircraftMarkerProps) {
  const profile = getAltitudeProfile(plane.altitude);
  const altFt = Math.round(plane.altitude * 3.281);
  const speedKmh = Math.round(plane.velocity * 3.6);

  return (
    <div className="relative flex flex-col items-center group -translate-x-1/2 -translate-y-1/2">
      {/* Radar ping ring */}
      <div className={`absolute w-9 h-9 ${profile.ring} rounded-full animate-ping pointer-events-none opacity-60`} />

      {/* Aircraft icon */}
      <div
        className={`relative flex items-center justify-center w-5 h-5 rounded-full ${profile.dot} border shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-125 cursor-pointer`}
        style={{ transform: `rotate(${plane.heading - 45}deg)` }}
      >
        <svg className={`w-2.5 h-2.5 ${profile.icon}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
        </svg>
      </div>

      {/* Callsign tag */}
      <div className={`mt-0.5 px-1 py-0 rounded text-[6px] font-bold font-mono ${profile.label} bg-slate-950/80 border border-current/20 select-none`}>
        {plane.callsign.trim() || plane.icao24.toUpperCase()}
      </div>

      {/* Hover telemetry card */}
      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-50 pointer-events-none" style={{ transform: 'rotate(0deg)' }}>
        <div className="px-3 py-2.5 rounded-xl bg-slate-950/98 border border-slate-800/80 text-[10px] text-slate-200 font-semibold shadow-2xl backdrop-blur-xl w-48">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 font-mono">
            <span className={`font-bold ${profile.icon}`}>{plane.callsign.trim() || 'UNKNOWN'}</span>
            <span className={`text-[7px] px-1.5 py-0.5 bg-slate-900 border border-current/30 rounded uppercase font-semibold ${profile.label}`}>
              {profile.phase}
            </span>
          </div>
          <div className="space-y-0.5 text-[9px] text-slate-500 font-mono">
            <div className="flex justify-between"><span>ICAO:</span><span className="text-slate-300">{plane.icao24}</span></div>
            <div className="flex justify-between"><span>Alt:</span><span className="text-slate-200">{altFt.toLocaleString()} ft</span></div>
            <div className="flex justify-between"><span>GS:</span><span className="text-slate-200">{speedKmh} km/h</span></div>
            <div className="flex justify-between"><span>HDG:</span><span className={profile.icon}>{plane.heading}°</span></div>
            <div className="flex justify-between"><span>VR:</span>
              <span className={plane.verticalRate > 0 ? 'text-emerald-400' : plane.verticalRate < 0 ? 'text-red-400' : 'text-slate-500'}>
                {plane.verticalRate > 0 ? '+' : ''}{Math.round(plane.verticalRate * 60)} ft/min
              </span>
            </div>
            <div className="flex justify-between pt-0.5 border-t border-slate-800 mt-0.5"><span>Registry:</span><span className="text-slate-400 truncate max-w-[90px]">{plane.originCountry}</span></div>
          </div>
        </div>
        <div className="w-2 h-2 bg-slate-950/98 border-r border-b border-slate-800/80 rotate-45 -mt-1" />
      </div>
    </div>
  );
}

export default function LiveAirTrafficOverlay() {
  const map = useMap();
  const [planes, setPlanes] = useState<AircraftState[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTraffic = useCallback(async () => {
    if (!map) return;
    try {
      const center = map.getCenter();
      if (!center) return;
      const lat = center.lat();
      const lng = center.lng();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/v3/traffic?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.traffic)) {
          setPlanes(data.traffic);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.error('Air traffic poll failed:', err);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;
    let active = true;

    const poll = () => {
      if (!active) return;
      fetchTraffic();
    };

    // Initial fetch after map is fully idle
    const idleListener = map.addListener('idle', () => {
      poll();
      google.maps.event.removeListener(idleListener);
    });

    // Poll every 10 seconds (conserves rate limits vs original 5s)
    const interval = setInterval(() => {
      if (active) poll();
    }, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [map, fetchTraffic]);

  if (!planes || planes.length === 0) return null;

  return (
    <>
      {/* Aircraft count badge */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-emerald-500/20 shadow-lg pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-bold text-emerald-300 font-mono">{planes.length} aircraft</span>
        {lastUpdated && (
          <span className="text-[9px] text-slate-600 font-mono">
            {lastUpdated.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Aircraft markers */}
      {planes.map((plane) => (
        <AdvancedMarker
          key={plane.icao24}
          position={{ lat: plane.latitude, lng: plane.longitude }}
          title={`${plane.callsign} — ${plane.originCountry}`}
        >
          <AircraftMarker plane={plane} />
        </AdvancedMarker>
      ))}
    </>
  );
}
