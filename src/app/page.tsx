'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { AddressInputForm } from '@/components/address-input-form';
import { AddressList } from '@/components/address-list';
import { RouteMap } from '@/components/route-map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPinned, AlertCircle, CheckCircle } from 'lucide-react';
import { optimizeRouteAction } from '@/lib/actions';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { getCountryFromCoordinates } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

export default function HomePage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);
  const [optimizedRouteReasoning, setOptimizedRouteReasoning] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const { toast } = useToast();

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location = {
            lat: latitude,
            lng: longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
          try {
            const countryCode = await getCountryFromCoordinates(latitude, longitude);
            setCountry(countryCode);
          } catch (e) {
             console.error("Could not get country from coordinates", e)
          }
        },
        error => {
          console.error("Geolocation error:", error);
          toast({
            title: "Location Access Denied",
            description: "Your location could not be determined. The map will default to a broader view.",
            variant: "default",
          });
        }
      );
    }
  }, [toast]);

  const handleAddressAdd = (address: string) => {
    if (addresses.includes(address)) {
      toast({
        title: "Duplicate Address",
        description: "This address is already in the list.",
        variant: "default",
      });
      return;
    }
    setAddresses((prev) => [...prev, address]);
    setOptimizedRoute([]);
    setOptimizedRouteReasoning(null);
    setError(null);
  };

  const handleAddressRemove = (indexToRemove: number) => {
    setAddresses((prev) => prev.filter((_, index) => index !== indexToRemove));
    setOptimizedRoute([]);
    setOptimizedRouteReasoning(null);
    setError(null);
  };
  
  const handleRecenter = (coords: { lat: number, lng: number }) => {
    setMapCenter(coords);
    toast({
      title: "Map Relocated",
      description: "The map has been centered to your current location.",
    });
  };

  const handleOptimizeRoute = async () => {
    if (addresses.length < 2) {
      setError("Please add at least two addresses to optimize the route.");
      toast({
        title: "Optimization Error",
        description: "At least two addresses are required.",
        variant: "destructive",
      });
      return;
    }
    setIsOptimizing(true);
    setError(null);
    setOptimizedRoute([]);
    setOptimizedRouteReasoning(null);

    try {
      const result = await optimizeRouteAction({ addresses, userLocation: userLocation ? `${userLocation.lat},${userLocation.lng}` : undefined });
      setOptimizedRoute(result.optimizedRoute);
      setOptimizedRouteReasoning(result.reasoning);
      toast({
        title: "Route Optimized!",
        description: "The best route has been calculated.",
        variant: "default",
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Optimization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow relative">
        <div className="absolute inset-0 h-full w-full">
            <RouteMap 
              addresses={addresses} 
              optimizedRoute={optimizedRoute}
              apiKey={googleMapsApiKey} 
              userLocation={userLocation}
              mapCenter={mapCenter}
              country={country}
            />
        </div>

        <Drawer snapPoints={[0.5, 1]} activeSnapPoint={0.5}>
          <DrawerContent className="z-20 max-h-[90vh] flex flex-col bg-card/95 backdrop-blur-sm">
              <DrawerHeader className="text-left">
                  <DrawerTitle>Plan Your Route</DrawerTitle>
                  <DrawerDescription>Add addresses and optimize your journey.</DrawerDescription>
              </DrawerHeader>
              <div className="flex-grow overflow-y-auto p-4 min-h-[100px]">
                  <div className="space-y-6 max-w-2xl mx-auto">
                      <AddressInputForm onAddressAdd={handleAddressAdd} onRecenter={handleRecenter} />
                      <AddressList addresses={addresses} onAddressRemove={handleAddressRemove} />
                      
                      <div className="flex gap-2">
                      <Button 
                          onClick={handleOptimizeRoute} 
                           disabled={isOptimizing || addresses.length < 2}
                          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-lg shadow-md"
                          aria-label="Optimize current route"
                      >
                          {isOptimizing ? (
                          <Spinner className="mr-2 h-5 w-5" />
                          ) : (
                          <MapPinned className="mr-2 h-5 w-5" />
                          )}
                          {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
                      </Button>
                      </div>

                      {error && (
                      <Alert variant="destructive" className="shadow-md">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                      </Alert>
                      )}

                      {optimizedRouteReasoning && (
                      <Card className="shadow-lg">
                          <CardHeader>
                          <CardTitle className="font-headline text-lg">AI Optimization Insights</CardTitle>
                          <CardDescription>How your route was optimized:</CardDescription>
                          </CardHeader>
                          <CardContent>
                          <p className="text-sm text-muted-foreground">{optimizedRouteReasoning}</p>
                          </CardContent>
                      </Card>
                      )}
                  </div>
              </div>
            </DrawerContent>
        </Drawer>
      </main>
    </div>
  );
}
