'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Camera, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { recognizeAddressAction } from '@/lib/actions';

interface AddressInputFormProps {
  onAddressAdd: (address: string) => void;
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function AddressInputForm({ onAddressAdd }: AddressInputFormProps) {
  const [manualAddress, setManualAddress] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        // Reset file input to allow uploading the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Add Addresses</CardTitle>
        <CardDescription>Enter addresses manually or upload photos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter an address"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualAdd()}
            aria-label="Enter an address manually"
          />
          <Button onClick={handleManualAdd} aria-label="Add manual address">
            <PlusCircle className="mr-2 h-5 w-5" /> Add
          </Button>
        </div>
        <div>
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
            disabled={isRecognizing}
            aria-label="Upload photo button"
          >
            {isRecognizing ? (
              <Spinner className="mr-2 h-5 w-5" />
            ) : (
              <Camera className="mr-2 h-5 w-5" />
            )}
            {isRecognizing ? 'Recognizing...' : 'Upload Photo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
