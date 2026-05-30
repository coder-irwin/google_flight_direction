import { Plane, Car, Train, Bus, Bike, Footprints, TramFront } from 'lucide-react';
import { RouteMode } from '../types';

interface TransportSelectorProps {
  selectedModes: RouteMode[];
  onToggleMode: (mode: RouteMode) => void;
  dark?: boolean;
}

const MODES: { id: RouteMode; icon: React.ReactNode; label: string }[] = [
  { id: 'flight', icon: <Plane size={16} />, label: 'Flight' },
  { id: 'car', icon: <Car size={16} />, label: 'Car' },
  { id: 'train', icon: <Train size={16} />, label: 'Train' },
  { id: 'bus', icon: <Bus size={16} />, label: 'Bus' },
  { id: 'metro', icon: <TramFront size={16} />, label: 'Metro' },
  { id: 'bike', icon: <Bike size={16} />, label: 'Bike' },
  { id: 'walk', icon: <Footprints size={16} />, label: 'Walk' },
];

export default function TransportSelector({ selectedModes, onToggleMode, dark = false }: TransportSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MODES.map((m) => {
        const isSelected = selectedModes.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggleMode(m.id)}
            title={m.label}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[48px] text-xs ${
              isSelected
                ? dark
                  ? 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                  : 'bg-blue-600 text-white shadow-md scale-105'
                : dark
                  ? 'bg-white/5 text-slate-500 border border-white/8 hover:bg-white/10 hover:text-slate-300'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            {m.icon}
            <span className="text-[9px] mt-0.5 font-medium">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}


