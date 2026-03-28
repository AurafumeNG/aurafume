'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Search, Heart, User } from 'lucide-react';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { href: '/',          icon: Home,        label: 'Home'     },
  { href: '/shop',      icon: ShoppingBag, label: 'Shop'     },
  { href: '/search',    icon: Search,      label: 'Search'   },
  { href: '/wishlist',  icon: Heart,       label: 'Wishlist' },
  { href: '/account',  icon: User,        label: 'Account'  },
] as const;

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260, delay: 0.15 }}
      aria-label="App navigation"
      className="fixed bottom-0 inset-x-0 z-50 h-16 bg-background/95 backdrop-blur-md border-t border-border sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="h-full flex items-center">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href === '/shop' && pathname.startsWith('/shop'));

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-1 h-full relative group"
              >
                {/* Active indicator dot */}
                {active && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                    transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                  />
                )}

                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.6}
                  className={`transition-colors duration-200 ${
                    active ? 'text-foreground' : 'text-foreground/40 group-hover:text-foreground/70'
                  }`}
                />
                <span
                  className={`text-[0.55rem] tracking-[0.14em] uppercase leading-none transition-colors duration-200 ${
                    active ? 'text-foreground' : 'text-foreground/40 group-hover:text-foreground/70'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
