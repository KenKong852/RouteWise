'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePlacesWidget } from "react-google-autocomplete";

interface ManualAddressFormProps {
  onAddressAdd: (address: string) => void;
  country: string | null;
}

export function ManualAddressForm({ onAddressAdd, country }: ManualAddressFormProps) {
  const [manualAddress, setManualAddress] = useState('');
  const { toast } = useToast();
  const { ref: autocompleteRef } = usePlacesWidget({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (place) => {
      setManualAddress(place.formatted_address || '');
    },
    options: {
      types: ["address"],
      componentRestrictions: country ? { country } : undefined,
    },
  });

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
        <CardTitle className="font-headline text-xl">Add Address</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            ref={autocompleteRef}
            id="manual-address-input"
            type="text"
            placeholder={country ? "Enter an address" : "Set your location first"}
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualAdd()}
            aria-label="Enter an address manually"
            disabled={!country}
          />
          <Button onClick={handleManualAdd} aria-label="Add manual address" disabled={!manualAddress.trim() || !country}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
