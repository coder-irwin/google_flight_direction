'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface AirportResult {
  iata: string;
  name: string;
  city: string;
  country: string;
}

interface AutocompleteInputProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  iconColor: string;
  dark?: boolean;
}

export default function AutocompleteInput({ placeholder, value, onChange, iconColor, dark = false }: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<AirportResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/api/v1/airports/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        if ((data.results || []).length > 0) setShowDropdown(true);
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (airport: AirportResult) => {
    onChange(`${airport.name}, ${airport.city}`);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Icon dot */}
      <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${iconColor}`} />

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (value.length >= 2 && suggestions.length > 0) setShowDropdown(true);
        }}
        className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none
          ${dark
            ? 'bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 focus:bg-white/8'
            : 'bg-white/60 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50'
          }`}
      />

      {showDropdown && suggestions.length > 0 && (
        <ul className={`absolute z-50 w-full mt-1 rounded-xl shadow-2xl max-h-60 overflow-auto scrollbar-hide py-1 ${
          dark
            ? 'bg-slate-900/95 border border-white/10 backdrop-blur-xl'
            : 'bg-white border border-gray-100'
        }`}>
          {suggestions.map((airport) => (
            <li
              key={airport.iata}
              onClick={() => handleSelect(airport)}
              className={`px-4 py-2.5 cursor-pointer flex items-start gap-3 transition-colors ${
                dark
                  ? 'hover:bg-white/5 text-slate-300'
                  : 'hover:bg-blue-50 text-gray-800'
              }`}
            >
              <MapPin size={13} className={dark ? 'text-indigo-400 mt-0.5 shrink-0' : 'text-blue-400 mt-0.5 shrink-0'} />
              <div className="min-w-0">
                <div className={`text-sm font-semibold truncate ${dark ? 'text-slate-200' : 'text-gray-800'}`}>
                  {airport.name}
                </div>
                <div className={`text-xs truncate ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {airport.city}, {airport.country}
                  <span className={`ml-2 font-bold font-mono ${dark ? 'text-indigo-400' : 'text-blue-500'}`}>
                    {airport.iata}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

