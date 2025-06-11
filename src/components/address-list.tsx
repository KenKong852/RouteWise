'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ListChecks } from 'lucide-react';

interface AddressListProps {
  addresses: string[];
  onAddressRemove: (index: number) => void;
}

export function AddressList({ addresses, onAddressRemove }: AddressListProps) {
  if (addresses.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Address List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No addresses added yet. Add addresses above to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
          <ListChecks /> Address List
        </CardTitle>
        <CardDescription>Review your entered addresses before optimizing.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-3"> {/* Added pr-3 for scrollbar spacing */}
          <ul className="space-y-2">
            {addresses.map((address, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md shadow-sm"
              >
                <span className="text-sm flex-1 break-words mr-2">
                  {index + 1}. {address}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAddressRemove(index)}
                  aria-label={`Remove address ${address}`}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
