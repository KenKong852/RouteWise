
'use client';

import { useEffect, useState, useRef } from 'react';
import { Map, AdvancedMarker, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface RouteMapProps {
  addresses: string[]; // Could be unsorted or optimized
  optimizedRoute?: string[]; // The AI optimized route strings
  userLocation?: { lat: number; lng: number } | null;
  mapCenter?: { lat: number; lng: number } | null;
}

interface GeocodedAddress {
  address: string;
  position: google.maps.LatLngLiteral;
}

const FALLBACK_CENTER = { lat: 37.0902, lng: -95.7129 }; // Center of USA
const DEFAULT_ZOOM = 4;
const USER_LOCATION_ZOOM = 15;

function MapView({ addresses, optimizedRoute, mapCenter: controlledMapCenter }: { addresses: string[], optimizedRoute?: string[], mapCenter?: { lat: number; lng: number } | null; userLocation?: { lat: number; lng: number } | null; }) {
  const map = useMap();
  const [geocodedAddresses, setGeocodedAddresses] = useState<GeocodedAddress[]>([]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] = useState<GeocodedAddress | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const displayedAddresses = optimizedRoute && optimizedRoute.length > 0 ? optimizedRoute : addresses;

  useEffect(() => {
    if (map && controlledMapCenter) {
      map.panTo(controlledMapCenter);
      map.setZoom(USER_LOCATION_ZOOM);
    }
  }, [map, controlledMapCenter]);

  useEffect(() => {
    if (!map || displayedAddresses.length === 0) {
      setGeocodedAddresses([]);
      setDirections(null);
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      return;
    }

    const geocoder = new google.maps.Geocoder();
    setIsLoading(true);
    setError(null);

    Promise.all(
      displayedAddresses.map(address =>
        new Promise<GeocodedAddress | null>((resolve) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              resolve({
                address,
                position: {
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                },
              });
            } else {
              console.warn(`Geocoding failed for ${address}: ${status}`);
              resolve(null); 
            }
          });
        })
      )
    )
    .then(results => {
      const validResults = results.filter(r => r !== null) as GeocodedAddress[];
      setGeocodedAddresses(validResults);
      
      if (validResults.length > 0) {
        if (!optimizedRoute || optimizedRoute.length === 0) {
           const newBounds = new google.maps.LatLngBounds();
            validResults.forEach(point => newBounds.extend(point.position));
            map.fitBounds(newBounds);
            if (validResults.length === 1) {
              map.setZoom(Math.min(map.getZoom() ?? USER_LOCATION_ZOOM, 15));
            }
        }
      }

      if (optimizedRoute && optimizedRoute.length >= 2) {
        const waypointsForRoute = validResults.filter(ga => optimizedRoute.includes(ga.address));
        // Reorder waypoints to match the optimized route order
        const orderedWaypoints = optimizedRoute
          .map(addr => waypointsForRoute.find(wp => wp.address === addr))
          .filter((wp): wp is GeocodedAddress => wp !== undefined);


        if (orderedWaypoints.length < 2) {
          setDirections(null);
          return;
        }

        const directionsService = new google.maps.DirectionsService();
        directionsService.route({
          origin: orderedWaypoints[0].address,
          destination: orderedWaypoints[orderedWaypoints.length - 1].address,
          waypoints: orderedWaypoints.slice(1, -1).map(ga => ({ location: ga.address, stopover: true })),
          travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
          if (status === 'OK' && result) {
            setDirections(result);
            // Fit map to the route bounds
            if (result.routes?.[0]?.bounds) {
              map.fitBounds(result.routes[0].bounds);
            }
          } else {
            console.error(`Directions request failed due to ${status}`);
            setError('Could not calculate directions for the optimized route.');
            setDirections(null);
          }
        });
      } else {
        setDirections(null);
      }

    })
    .catch(err => {
      console.error("Geocoding error:", err);
      setError("Error geocoding addresses.");
    })
    .finally(() => {
      setIsLoading(false);
    });

  }, [map, addresses.join(','), optimizedRoute?.join(',')]);

  useEffect(() => {
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (directions && directions.routes && directions.routes.length > 0) {
      const route = directions.routes[0];
      const newPolyline = new google.maps.Polyline({
        path: route.overview_path,
        geodesic: true,
        strokeColor: 'hsl(var(--primary))',
        strokeOpacity: 0.8,
        strokeWeight: 6,
      });
      newPolyline.setMap(map);
      polylineRef.current = newPolyline;
    }
  }, [map, directions]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <Spinner size={48} />
        </div>
      )}
      {error && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground p-2 rounded-md shadow-lg z-10 text-sm">
          {error}
        </div>
      )}
      {geocodedAddresses.map((point, index) => (
        <AdvancedMarker
          key={`${point.address}-${index}`}
          position={point.position}
          onClick={() => setActiveMarker(point)}
        >
          <MapPin className="text-accent h-8 w-8" fill="hsl(var(--accent-foreground))" />
        </AdvancedMarker>
      ))}
      {activeMarker && (
        <InfoWindow
          position={activeMarker.position}
          onCloseClick={() => setActiveMarker(null)}
          pixelOffset={new google.maps.Size(0, -40)}
        >
          <div className="p-1">
            <p className="font-semibold text-sm">{activeMarker.address}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}


export function RouteMap({ addresses, optimizedRoute, userLocation, mapCenter }: RouteMapProps) {
  return (
    <div className="h-full w-full">
        <Map
            defaultCenter={mapCenter ?? FALLBACK_CENTER}
            defaultZoom={userLocation ? USER_LOCATION_ZOOM : DEFAULT_ZOOM}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId="routeWiseMap"
            className="h-full w-full"
            >
            <MapView addresses={addresses} optimizedRoute={optimizedRoute} mapCenter={mapCenter} userLocation={userLocation} />
        </Map>
    </div>
  );
}
