'use client';

import { Route } from '../types';
import { Plane, Car, ArrowRight, Clock, Compass, Navigation, ShieldAlert, Sparkles, ChevronDown, ChevronUp, CloudRain, Thermometer } from 'lucide-react';
import { useState } from 'react';

interface RouteCardProps {
  route: Route;
  isSelected?: boolean;
}

export default function RouteCard({ route, isSelected = false }: RouteCardProps) {
  const [expanded, setExpanded] = useState(false);

  const flightSegment = route.segments.find(s => s.type === 'flight');
  const flightSegments = route.segments.filter(s => s.type === 'flight');
  const isMultiLeg = flightSegments.length > 1;

  const formatCurrency = (val: number) => {
    if (val >= 50000) return `$${Math.round(val / 83).toLocaleString()}`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getConditionEmoji = (condition?: string) => {
    if (!condition) return '';
    const map: Record<string, string> = { storm: '⛈️', rain: '🌧️', snow: '❄️', clouds: '☁️', clear: '☀️' };
    return map[condition] || '';
  };

  return (
    <div
      className={`rounded-2xl p-4 border transition-all duration-300 cursor-pointer group flex flex-col gap-3 ${
        isSelected
          ? 'bg-indigo-950/40 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
          : 'glass border-white/8 hover:border-indigo-500/20 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase border ${
              isMultiLeg
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}>
              {isMultiLeg ? `${flightSegments.length}-Stop` : 'Direct'} ✈
            </span>
            {route.aiIntelligence?.aiRankLabel && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center gap-1">
                <Sparkles size={7} className="animate-pulse" />
                {route.aiIntelligence.aiRankLabel}
              </span>
            )}
          </div>

          {/* Route IATA codes */}
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-200 mb-1">
            <span className="font-mono text-indigo-300">{flightSegments[0]?.origin}</span>
            {isMultiLeg && flightSegments.slice(0, -1).map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                <ArrowRight size={10} className="text-slate-600" />
                <span className="font-mono text-amber-400 text-xs">{seg.destination}</span>
              </span>
            ))}
            <ArrowRight size={10} className="text-slate-600" />
            <span className="font-mono text-rose-400">{flightSegments[flightSegments.length - 1]?.destination}</span>
          </div>

          {/* Duration & Cost */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-300">
              <Clock size={12} className="text-slate-500" />
              {route.totalDurationText}
            </span>
            {route.totalCostEstimate && (
              <span className="text-xs font-bold text-emerald-400">
                {formatCurrency(route.totalCostEstimate)}
              </span>
            )}
            {flightSegment?.departureTime && (
              <span className="text-[10px] text-slate-600 font-mono">
                Dep {flightSegment.departureTime}
              </span>
            )}
          </div>
        </div>

        {/* AI Rank Score */}
        <div className="flex flex-col items-end shrink-0 gap-1">
          {route.aiRankScore !== undefined && (
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">AI Score</span>
              <span className="text-2xl font-black text-indigo-300 leading-none">{route.aiRankScore}</span>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="mt-1 p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Airline info */}
      {flightSegment && (
        <div className="flex items-center gap-2 text-[10px] text-slate-500 -mt-1">
          <Plane size={10} className="text-indigo-500" />
          <span>{flightSegment.airline}</span>
          <span className="font-mono text-slate-600">{flightSegment.flightNumber}</span>
          {flightSegment.distanceText && (
            <>
              <span className="text-slate-700">·</span>
              <Navigation size={9} className="text-slate-600" />
              <span>{flightSegment.distanceText}</span>
            </>
          )}
        </div>
      )}

      {/* Segment flow badges */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {route.segments.map((segment, idx) => {
          const isFlight = segment.type === 'flight';
          const isWalk = segment.mode === 'walk';
          return (
            <div key={idx} className="flex items-center gap-1 shrink-0">
              <div className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-semibold border ${
                isFlight
                  ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300'
                  : isWalk
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-white/5 border-white/8 text-slate-500'
              }`}>
                {isFlight ? <Plane size={10} /> : isWalk ? '⏳' : <Car size={10} />}
                <span>{isFlight ? segment.origin : segment.durationText}</span>
              </div>
              {idx < route.segments.length - 1 && (
                <ArrowRight size={8} className="text-slate-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Journey Timeline */}
      {expanded && (
        <div className="flex flex-col gap-3 bg-white/3 rounded-xl p-3.5 border border-white/5 animate-fade-in-up">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-600">Journey Timeline</span>
          <div className="flex flex-col gap-3.5 relative pl-3.5 border-l border-dashed border-white/10">
            {route.segments.map((segment, idx) => {
              const isFlight = segment.type === 'flight';
              return (
                <div key={idx} className="relative flex flex-col gap-1">
                  <div className={`absolute -left-[18px] top-1 w-2 h-2 rounded-full border-2 bg-slate-950 ${
                    isFlight ? 'border-indigo-400' : 'border-slate-700'
                  }`} />
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1.5 ${isFlight ? 'text-slate-200' : 'text-slate-500'}`}>
                      {isFlight ? <Plane size={11} className="text-indigo-400" /> : <Car size={11} className="text-slate-600" />}
                      {isFlight ? `${segment.airline} · ${segment.flightNumber}` : `Ground: → ${segment.destination}`}
                    </span>
                    <span className={`font-bold text-[11px] ${isFlight ? 'text-slate-300' : 'text-slate-600'}`}>
                      {segment.durationText}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-600 pl-4">
                    <span className="flex items-center gap-1">
                      <Compass size={9} />
                      {segment.origin} → {segment.destination}
                    </span>
                    {segment.departureTime && isFlight && (
                      <span className="font-mono text-indigo-500">Dep {segment.departureTime}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weather Alert */}
      {route.weatherReport && route.weatherReport.delayIndexWeight > 1.2 && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-medium">
          <CloudRain size={12} className="shrink-0 animate-pulse" />
          <span>{route.weatherReport.description}</span>
          {route.weatherReport.tempCelsius && (
            <span className="ml-auto shrink-0 flex items-center gap-1 text-amber-400">
              <Thermometer size={10} />
              {route.weatherReport.tempCelsius}°C
            </span>
          )}
        </div>
      )}

      {/* AI Insights */}
      {route.aiIntelligence && (
        <div className="bg-indigo-950/30 border border-indigo-500/15 p-3 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
            <Sparkles size={12} className="animate-pulse text-indigo-400" />
            AI Intelligence Insights
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            "{route.aiIntelligence.customInsight}"
          </p>
          <div className="grid grid-cols-3 gap-2 text-[9px] border-t border-indigo-900/40 pt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-600 uppercase tracking-wider">Comfort</span>
              <span className="font-extrabold text-emerald-400">{route.aiIntelligence.comfortScore}/100</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-600 uppercase tracking-wider">Stress</span>
              <span className={`font-extrabold ${route.aiIntelligence.stressScore > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                {route.aiIntelligence.stressScore}/100
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-600 uppercase tracking-wider">Sleep</span>
              <span className={`font-extrabold ${route.aiIntelligence.sleepFriendlyRating === 'High' ? 'text-sky-400' : 'text-slate-500'}`}>
                {route.aiIntelligence.sleepFriendlyRating}
              </span>
            </div>
          </div>
          {route.aiIntelligence.terminalAlert && (
            <div className="flex items-start gap-1.5 text-[9px] text-slate-500 mt-0.5 border-t border-indigo-900/30 pt-2">
              <ShieldAlert size={10} className="text-amber-500 shrink-0 mt-0.5" />
              <span>{route.aiIntelligence.terminalAlert}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
