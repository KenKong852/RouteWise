
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Camera, LocateFixed } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { recognizeAddressAction } from '@/lib/actions';

interface ManualAddressFormProps {
  onAddressAdd: (address: string) => void;
  bounds: google.maps.LatLngBounds | null;
}

export function ManualAddressForm({ onAddressAdd, bounds }: ManualAddressFormProps) {
  const [manualAddress, setManualAddress] = useState('');
  const { toast } = useToast();
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (autocompleteInputRef.current && window.google && window.google.maps && window.google.maps.places && bounds) {
      const options = {
        fields: ["formatted_address"],
        types: ["address"],
        bounds: bounds,
        strictBounds: false,
      };

      autocompleteInstance.current = new (window as any).google.maps.places.Autocomplete(autocompleteInputRef.current, options);

      autocompleteInstance.current.addListener('place_changed', () => {
        const place = autocompleteInstance.current?.getPlace();
        if (place && place.formatted_address) {
          onAddressAdd(place.formatted_address);
          setManualAddress('');
        }
      });
    }

    return () => {
      if (autocompleteInstance.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        (window as any).google.maps.event.clearInstanceListeners(autocompleteInstance.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds]);

  const handleManualAdd = () => {
    if (manualAddress.trim()) {
      onAddressAdd(manualAddress.trim());
      setManualAddress('');
    } else {
      toast({
        title: "Input Error",
        description: "Please enter an address.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Add Address Manually</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            ref={autocompleteInputRef}
            type="text"
            placeholder="Enter an address"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualAdd()}
            aria-label="Enter an address manually"
            disabled={!bounds}
          />
          <Button onClick={handleManualAdd} aria-label="Add manual address" disabled={!bounds}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add
          </Button>
        </div>
        {!bounds && <p className="text-xs text-muted-foreground mt-2">Waiting for location to enable address search...</p>}
      </CardContent>
    </Card>
  );
}


interface ActionButtonsProps {
    onAddressAdd: (address: string) => void;
    onRecenter: (coords: { lat: number; lng: number }) => void;
}
  
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function ActionButtons({ onAddressAdd, onRecenter }: ActionButtonsProps) {
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGetLocation = () => {
        if ('geolocation' in navigator) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
            onRecenter({ lat: position.coords.latitude, lng: position.coords.longitude });
            setIsLocating(false);
            },
            (error) => {
                let description = "An unknown error occurred.";
                if (error.code === error.PERMISSION_DENIED) {
                    description = "Please allow location access to use this feature.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    description = "Your location information is currently unavailable.";
                }
                toast({
                title: "Could Not Get Location",
                description,
                variant: "destructive",
                });
                setIsLocating(false);
            }
        );
        } else {
            toast({
                title: "Geolocation Not Supported",
                description: "Your browser does not support geolocation.",
                variant: "destructive",
            });
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
        setIsRecognizing(true);
        try {
            if (file.size > 4 * 1024 * 1024) { // Max 4MB
            toast({
                title: "File Too Large",
                description: "Please upload an image smaller than 4MB.",
                variant: "destructive",
            });
            setIsRecognizing(false);
            return;
            }
            const photoDataUri = await fileToDataUri(file);
            const result = await recognizeAddressAction({ photoDataUri });
            if (result.address) {
            onAddressAdd(result.address);
            toast({
                title: "Address Recognized",
                description: `Added: ${result.address}`,
            });
            } else {
            toast({
                title: "Recognition Failed",
                description: "Could not find an address in the photo. Please try a clearer image or enter manually.",
                variant: "destructive",
            });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during photo processing.";
            toast({
            title: "Photo Upload Error",
            description: errorMessage,
            variant: "destructive",
            });
        } finally {
            setIsRecognizing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
        }
    };
    
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Other Options</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2">
                <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    ref={fileInputRef}
                    aria-label="Upload photo of an address"
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={isRecognizing || isLocating}
                    aria-label="Upload photo button"
                >
                    {isRecognizing ? (
                    <Spinner className="mr-2 h-5 w-5" />
                    ) : (
                    <Camera className="mr-2 h-5 w-5" />
                    )}
                    {isRecognizing ? 'Recognizing...' : 'From Photo'}
                </Button>
                <Button
                    onClick={handleGetLocation}
                    variant="outline"
                    className="w-full"
                    disabled={isLocating || isRecognizing}
                    aria-label="Use current location"
                >
                    {isLocating ? (
                        <Spinner className="mr-2 h-5 w-5" />
                    ) : (
                        <LocateFixed className="mr-2 h-5 w-5" />
                    )}
                    {isLocating ? 'Locating...' : 'My Location'}
                </Button>
                </div>
            </CardContent>
        </Card>
    )
}
