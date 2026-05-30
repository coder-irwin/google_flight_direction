'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import TransportSelector from './TransportSelector';
import { Route, RouteMode, RouteResponse } from '../types';
import { Search, Loader2, Sparkles, CalendarDays, Users, ChevronDown, Plane, Radio, Cloud, Thermometer, Wind } from 'lucide-react';
import RouteCard from './RouteCard';
import AutocompleteInput from './AutocompleteInput';

const ConversationalSearch = dynamic(() => import('./premium/ConversationalSearch'), {
  loading: () => <div className="h-12 rounded-xl bg-white/5 animate-pulse" />,
  ssr: false
});

const PriceAnalytics = dynamic(() => import('./premium/PriceAnalytics'), {
  loading: () => <div className="h-32 rounded-xl bg-white/5 animate-pulse" />,
  ssr: false
});

interface SearchPanelProps {
  onRouteSelect: (route: Route | null) => void;
  selectedRoute: Route | null;
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;
  showLiveTraffic: boolean;
  setShowLiveTraffic: (val: boolean) => void;
}

interface WeatherData {
  condition: string;
  tempCelsius: number;
  windKmh: number;
  description: string;
  source: 'live' | 'fallback';
}

const CABIN_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First'] as const;
type CabinClass = typeof CABIN_CLASSES[number];

export default function SearchPanel({
  onRouteSelect,
  selectedRoute,
  isPremium,
  setIsPremium,
  showLiveTraffic,
  setShowLiveTraffic
}: SearchPanelProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [modes, setModes] = useState<RouteMode[]>(['flight']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RouteResponse | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<CabinClass>('Economy');
  const [showCabinDropdown, setShowCabinDropdown] = useState(false);
  const [destWeather, setDestWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Set default departure date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDepartureDate(today || '');
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('premium') === 'true' || urlParams.get('premium') === '1') {
        setIsPremium(true);
      }
    }
  }, [setIsPremium]);

  // Fetch destination weather when destination changes (debounced)
  useEffect(() => {
    if (!destination || destination.length < 3) {
      setDestWeather(null);
      return;
    }
    const timer = setTimeout(async () => {
      setWeatherLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        // Extract city name from "Airport Name, City" format
        const cityPart = destination.includes(',') ? destination.split(',')[1]?.trim() : destination;
        const res = await fetch(`${apiUrl}/api/v1/weather/${encodeURIComponent(cityPart || destination)}`);
        if (res.ok) {
          const data = await res.json();
          setDestWeather(data);
        }
      } catch {
        // Silent fail for weather — non-critical
      } finally {
        setWeatherLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [destination]);

  const toggleMode = (mode: RouteMode) => {
    setModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleSearch = useCallback(async (overrideQuery?: string) => {
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const endpoint = isPremium ? '/api/v3/routes' : '/api/v1/routes';

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          modes,
          aiQuery: overrideQuery || aiQuery,
          departureDate,
          passengers,
          cabinClass,
        })
      });

      const data = await res.json();
      setResults(data);
      if (data.routes && data.routes.length > 0) {
        onRouteSelect(data.routes[0]);
      }
    } catch (error) {
      console.error('Failed to search routes:', error);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, modes, aiQuery, isPremium, departureDate, passengers, cabinClass, onRouteSelect]);

  useEffect(() => {
    if (origin && destination) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const getWeatherIcon = (condition: string) => {
    if (condition === 'storm') return '⛈️';
    if (condition === 'rain') return '🌧️';
    if (condition === 'snow') return '❄️';
    if (condition === 'clouds') return '☁️';
    return '☀️';
  };

  const getWeatherColor = (condition: string) => {
    if (condition === 'storm') return 'text-red-400';
    if (condition === 'rain') return 'text-blue-400';
    if (condition === 'snow') return 'text-sky-300';
    if (condition === 'clouds') return 'text-slate-400';
    return 'text-amber-400';
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-[420px] max-h-[92vh] flex flex-col gap-3 overflow-y-auto scrollbar-hide pb-6 select-none">
      {/* Main Search Card */}
      <div className="glass rounded-2xl p-5 shadow-2xl border border-indigo-500/10 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                <Plane size={12} className="text-white" />
              </div>
              <h1 className="text-base font-bold gradient-text tracking-tight">
                SkyIntel
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 tracking-wider uppercase">Aviation Intelligence</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Traffic Toggle */}
            <button
              type="button"
              id="toggle-live-traffic"
              onClick={() => setShowLiveTraffic(!showLiveTraffic)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 shadow-sm ${
                showLiveTraffic
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Radio size={10} className={showLiveTraffic ? 'animate-pulse' : ''} />
              <span>{showLiveTraffic ? 'Live' : 'Traffic'}</span>
            </button>

            {/* Premium AI Toggle */}
            <button
              type="button"
              id="toggle-ai-mode"
              onClick={() => setIsPremium(!isPremium)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 shadow-sm ${
                isPremium
                  ? 'bg-gradient-to-r from-indigo-600/80 to-violet-600/80 text-white border border-indigo-500/40 shadow-indigo-500/25'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Sparkles size={10} />
              <span>{isPremium ? 'AI Mode' : 'AI'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col gap-3">
          {/* Origin & Destination */}
          <AutocompleteInput
            placeholder="From — Origin city or airport"
            value={origin}
            onChange={setOrigin}
            iconColor="border-2 border-indigo-500 bg-indigo-500/10"
            dark
          />
          <AutocompleteInput
            placeholder="To — Destination city or airport"
            value={destination}
            onChange={setDestination}
            iconColor="bg-rose-500"
            dark
          />

          {/* Destination Weather Widget */}
          {(destWeather || weatherLoading) && destination && (
            <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs transition-all ${
              destWeather?.condition === 'storm' || destWeather?.condition === 'snow'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-white/5 border-white/10'
            }`}>
              {weatherLoading ? (
                <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse" />
              ) : destWeather ? (
                <>
                  <span className="text-lg">{getWeatherIcon(destWeather.condition)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${getWeatherColor(destWeather.condition)}`}>
                      {destWeather.tempCelsius}°C · {destWeather.windKmh} km/h wind
                    </p>
                    <p className="text-slate-500 text-[10px] truncate">{destWeather.description}</p>
                  </div>
                  {destWeather.source === 'live' && (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider shrink-0">Live</span>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Date + Passengers Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all [color-scheme:dark]"
              />
            </div>

            <div className="relative">
              <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none [color-scheme:dark]"
              >
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cabin Class Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCabinDropdown(!showCabinDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/8 transition-all"
            >
              <span className="flex items-center gap-2">
                <Plane size={12} className="text-indigo-400" />
                <span>{cabinClass}</span>
              </span>
              <ChevronDown size={12} className={`text-slate-500 transition-transform ${showCabinDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showCabinDropdown && (
              <div className="absolute top-full mt-1 w-full z-50 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                {CABIN_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => { setCabinClass(cls); setShowCabinDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                      cabinClass === cls
                        ? 'bg-indigo-600/30 text-indigo-300'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {cls}
                    {cls === 'Business' && <span className="ml-2 text-[9px] text-amber-400 font-bold">PREMIUM</span>}
                    {cls === 'First' && <span className="ml-2 text-[9px] text-indigo-400 font-bold">LUXURY</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transport Mode */}
          <div>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-2">Transport Mode</p>
            <TransportSelector selectedModes={modes} onToggleMode={toggleMode} dark />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            id="search-routes-btn"
            disabled={loading || !origin || !destination}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              isPremium
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            {loading ? 'Analyzing routes...' : isPremium ? '✨ AI Route Search' : 'Find Routes'}
          </button>
        </form>
      </div>

      {/* Conversational AI (Premium only) */}
      {isPremium && (
        <div className="animate-fade-in-up">
          <ConversationalSearch
            value={aiQuery}
            onChange={setAiQuery}
            onSearchSubmit={(q) => handleSearch(q || aiQuery)}
          />
        </div>
      )}

      {/* Price Analytics */}
      {selectedRoute?.pricingAnalytics && (
        <div className="animate-fade-in-up">
          <PriceAnalytics analytics={selectedRoute.pricingAnalytics} />
        </div>
      )}

      {/* Route Results */}
      {results && results.routes && results.routes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              {results.routes.length} Route{results.routes.length > 1 ? 's' : ''} Found
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          {results.routes.map((route, i) => (
            <div
              key={i}
              onClick={() => onRouteSelect(route)}
              className="cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <RouteCard route={route} isSelected={selectedRoute === route} />
            </div>
          ))}
        </div>
      )}

      {results && results.routes && results.routes.length === 0 && !loading && (
        <div className="glass rounded-2xl p-6 text-center animate-fade-in-up">
          <p className="text-3xl mb-2">✈️</p>
          <p className="text-sm font-semibold text-slate-400">No routes found</p>
          <p className="text-xs text-slate-600 mt-1">Try different origin/destination or transport modes</p>
        </div>
      )}
    </div>
  );
}
