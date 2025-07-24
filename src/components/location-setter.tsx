'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { usePlacesWidget } from "react-google-autocomplete";
import * as Geocode from "react-geocode";

Geocode.setKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string);

interface LocationSetterProps {
  onLocationSet: (location: { lat: number; lng: number; country: string }) => void;
}

export function LocationSetter({ onLocationSet }: LocationSetterProps) {
  const [locationSearch, setLocationSearch] = useState('');

  const { ref: autocompleteRef } = usePlacesWidget({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (place) => {
      setLocationSearch(place.formatted_address || '');
    },
    options: {
      types: ["(cities)"],
    },
  });

  const handleSetLocation = async () => {
    if (!locationSearch) return;
    try {
      const results = await Geocode.fromAddress(locationSearch);
      const { lat, lng } = results.results[0].geometry.location;
      const countryComponent = results.results[0].address_components.find(c => c.types.includes('country'));
      const country = countryComponent ? countryComponent.short_name : '';
      onLocationSet({ lat, lng, country });
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Set Your Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            ref={autocompleteRef}
            type="text"
            placeholder="Search for a city or region"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
          />
          <Button onClick={handleSetLocation}>
            <MapPin className="mr-2 h-5 w-5" /> Set Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
