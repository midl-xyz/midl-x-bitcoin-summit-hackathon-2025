'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MIDLWalletConnectButton } from '@/components/shared/wallet/WalletConnectButton';
import { 
  Home, 
  PlusCircle, 
  Calculator, 
  BarChart3, 
  Settings,
  Menu
} from 'lucide-react';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    href: '/wizard',
    label: 'New Position',
    icon: PlusCircle,
  },
  {
    href: '/simulator',
    label: 'Simulator',
    icon: Calculator,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95">
              <BarChart3 className="h-6 w-6 transition-transform duration-200 hover:rotate-12" />
              <span className="font-bold text-xl transition-colors duration-200 hover:text-primary">Helios Yield</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                                (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95"
                    asChild
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 transition-transform duration-200 hover:rotate-6" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MIDLWalletConnectButton className="hidden md:flex" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95"
            >
              <Settings className="h-5 w-5 transition-transform duration-200 hover:rotate-90" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95"
            >
              <Menu className="h-5 w-5 transition-transform duration-200 hover:scale-125" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}