'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import MainMap from '@/components/MainMap';
import SearchPanel from '@/components/SearchPanel';
import RouteVisualizer from '@/components/RouteVisualizer';
import LiveAirTrafficOverlay from '@/components/LiveAirTrafficOverlay';
import { Route } from '@/types';

const PremiumRouteVisualizer = dynamic(() => import('@/components/premium/PremiumRouteVisualizer'), {
  ssr: false
});

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showLiveTraffic, setShowLiveTraffic] = useState(false);

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Full-screen map */}
      <MainMap isPremium={isPremium}>
        {/* Route visualization layer */}
        {selectedRoute?.aiIntelligence ? (
          <PremiumRouteVisualizer route={selectedRoute} />
        ) : (
          <RouteVisualizer route={selectedRoute} />
        )}

        {/* Real-time air traffic overlay */}
        {showLiveTraffic && <LiveAirTrafficOverlay />}
      </MainMap>

      {/* Search & Intelligence Panel */}
      <SearchPanel
        onRouteSelect={setSelectedRoute}
        selectedRoute={selectedRoute}
        isPremium={isPremium}
        setIsPremium={setIsPremium}
        showLiveTraffic={showLiveTraffic}
        setShowLiveTraffic={setShowLiveTraffic}
      />

      {/* SkyIntel watermark */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 pointer-events-none select-none">
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
        <span className="text-[10px] font-bold text-slate-600 tracking-wider">SKYINTEL v3</span>
      </div>
    </main>
  );
}
