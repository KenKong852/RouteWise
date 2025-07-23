
'use client';

import { useState, useEffect } from 'react';
import { ManualAddressForm, ActionButtons } from '@/components/address-input-form';
import { AddressList } from '@/components/address-list';
import { RouteMap } from '@/components/route-map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPinned, AlertCircle, CheckCircle, PanelTopOpen } from 'lucide-react';
import { optimizeRouteAction } from '@/lib/actions';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { APIProvider } from '@vis.gl/react-google-maps';

declare global {
  interface Window {
    onAddressAdd: ((address: string) => void) | undefined;
  }
}

export default function HomePage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);
  const [optimizedRouteReasoning, setOptimizedRouteReasoning] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(0.5);
  
  const { toast } = useToast();
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = {
            lat: latitude,
            lng: longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
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
  
  const handleActiveSnapPointChange = (snapPoint: number | string | null) => {
    setActiveSnapPoint(snapPoint);
    if (snapPoint === 0.15) {
      setIsOpen(false);
    }
  };
  
  const handleOpenDrawer = () => {
    setIsOpen(true);
    setActiveSnapPoint(0.5);
  };

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

  useEffect(() => {
    window.onAddressAdd = handleAddressAdd;
    return () => {
      window.onAddressAdd = undefined;
    }
  }, [addresses, toast]);


  const handleAddressRemove = (indexToRemove: number) => {
    setActiveSnapPoint(prev => prev);
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
  
  if (!googleMapsApiKey) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted">
        <p className="text-destructive-foreground bg-destructive p-4 rounded-md shadow-lg">
            Google Maps API Key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={['places', 'geocoding', 'geometry']}>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <main className="flex-grow relative">
          <div className="absolute inset-0 h-full w-full">
              <RouteMap 
                addresses={addresses} 
                optimizedRoute={optimizedRoute}
                userLocation={userLocation}
                mapCenter={mapCenter}
              />
          </div>
          
          <Drawer
            open={isOpen}
            onOpenChange={setIsOpen}
            snapPoints={[0.15, 0.5, 1]}
            activeSnapPoint={activeSnapPoint}
            onActiveSnapPointChange={handleActiveSnapPointChange}
          >
            <DrawerContent className="z-20 max-h-[90vh] flex flex-col bg-card/95 backdrop-blur-sm">
              <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
                <DrawerHeader className="text-left">
                    <DrawerTitle>Plan Your Route</DrawerTitle>
                    <DrawerDescription>Add addresses and optimize your journey.</DrawerDescription>
                </DrawerHeader>
                <div className="flex-grow overflow-y-auto p-4 min-h-[100px]">
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="space-y-4">
                            <ManualAddressForm onAddressAdd={handleAddressAdd} />
                            <ActionButtons onAddressAdd={handleAddressAdd} onRecenter={handleRecenter} />
                        </div>

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
          {!isOpen && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
              <Button
                onClick={handleOpenDrawer}
                className="py-3 text-lg shadow-lg"
                aria-label="Open route planner"
              >
                <PanelTopOpen className="mr-2 h-5 w-5" />
                Plan Route
              </Button>
            </div>
          )}
        </main>
      </div>
    </APIProvider>
  );
}
