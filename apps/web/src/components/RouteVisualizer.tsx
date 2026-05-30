'use client';

import { useEffect, useState } from 'react';
import { useMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Route } from '../types';

interface RouteVisualizerProps {
  route: Route | null;
}

export default function RouteVisualizer({ route }: RouteVisualizerProps) {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;
    
    // Cleanup previous drawing
    if (polyline) polyline.setMap(null);
    
    if (!route) return;

    const flightSegment = route.segments.find(s => s.type === 'flight');
    let newPolylineInstance: google.maps.Polyline | null = null;

    if (flightSegment && flightSegment.startLocation && flightSegment.endLocation) {
      const flightPath = [
        flightSegment.startLocation,
        flightSegment.endLocation
      ];

      // Draw geodesic line for flight
      newPolylineInstance = new google.maps.Polyline({
        path: flightPath,
        geodesic: true,
        strokeColor: '#3b82f6', // blue-500
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map,
      });

      setPolyline(newPolylineInstance);

      // Adjust map bounds
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(flightSegment.startLocation);
      bounds.extend(flightSegment.endLocation);
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 450, right: 50 }); // padding to account for left panel
    }

    return () => {
      if (newPolylineInstance) newPolylineInstance.setMap(null);
    };
  }, [map, route]);

  if (!route) return null;

  const flightSegment = route.segments.find(s => s.type === 'flight');
  if (!flightSegment || !flightSegment.startLocation || !flightSegment.endLocation) return null;

  return (
    <>
      <AdvancedMarker
        position={flightSegment.startLocation}
        title={flightSegment.origin}
      >
        <Pin background={'#3b82f6'} borderColor={'#ffffff'} glyphColor={'#ffffff'} glyph={'✈'} />
      </AdvancedMarker>

      <AdvancedMarker
        position={flightSegment.endLocation}
        title={flightSegment.destination}
      >
        <Pin background={'#10b981'} borderColor={'#ffffff'} glyphColor={'#ffffff'} glyph={'▼'} />
      </AdvancedMarker>
    </>
  );
}
