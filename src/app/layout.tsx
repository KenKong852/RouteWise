
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'RouteWise',
  description: 'Smart route optimization with AI address recognition.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function initAutocomplete() {
                const input = document.getElementById("manual-address-input");
                if (!input) {
                  setTimeout(initAutocomplete, 100); // Retry if input not ready
                  return;
                }
                const searchBox = new google.maps.places.SearchBox(input);
                searchBox.addListener("places_changed", () => {
                  const places = searchBox.getPlaces();
                  if (places && places.length > 0 && places[0].formatted_address) {
                    if (window.onAddressAdd) {
                      window.onAddressAdd(places[0].formatted_address);
                    }
                    input.value = '';
                  }
                });
              }
              window.initAutocomplete = initAutocomplete;
            `,
          }}
        />
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAutocomplete`}
          async
          defer
        ></script>
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
