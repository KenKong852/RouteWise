import Link from 'next/link';
import { Logo } from '@/components/icons/logo';

export function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Logo className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold">RouteWise</h1>
        </Link>
      </div>
    </header>
  );
}
