'use client';

import { Map } from '@vis.gl/react-google-maps';

interface MainMapProps {
  isPremium: boolean;
  children?: React.ReactNode;
}

const MAP_ID = process.env.NEXT_PUBLIC_MAP_ID || 'DEMO_MAP_ID';

export default function MainMap({ isPremium, children }: MainMapProps) {
  return (
    <div className="absolute inset-0 z-0">
      <Map
        mapId={MAP_ID}
        defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
        defaultZoom={isPremium ? 4 : 5}
        gestureHandling="greedy"
        disableDefaultUI={true}
        clickableIcons={false}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </Map>
    </div>
  );
}
