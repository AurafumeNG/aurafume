'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, ShoppingCart, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/collections', label: 'Collections' },
];

export default function Navbar({ cartCount = 0 }: { cartCount?: number }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="w-full bg-background/90 backdrop-blur-md border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo/aurafumeng-logo.png"
              alt="AuraFume"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-sm tracking-widest uppercase transition-colors hover:text-accent ${
                    pathname === href ? 'text-accent' : 'text-foreground/80'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="text-foreground/70 hover:text-accent transition-colors"
            >
              <Search size={20} />
            </button>

            <button
              aria-label="Wishlist"
              className="hidden sm:block text-foreground/70 hover:text-accent transition-colors"
            >
              <Heart size={20} />
            </button>

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-foreground/70 hover:text-accent transition-colors"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            <button
              aria-label="Open menu"
              className="md:hidden text-foreground/70 hover:text-accent transition-colors"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          drawerOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-background shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <Image
            src="/logo/aurafumeng-logo.png"
            alt="AuraFume"
            width={100}
            height={36}
            className="h-8 w-auto object-contain"
          />
          <button
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="text-foreground/70 hover:text-accent transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="px-6 pt-8 flex flex-col gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={`text-base tracking-widest uppercase transition-colors hover:text-accent ${
                pathname === href ? 'text-accent' : 'text-foreground/80'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Drawer Icon Row */}
        <div className="px-6 mt-8 pt-8 border-t border-border flex items-center gap-6">
          <button
            aria-label="Search"
            className="text-foreground/70 hover:text-accent transition-colors"
          >
            <Search size={20} />
          </button>
          <button
            aria-label="Wishlist"
            className="text-foreground/70 hover:text-accent transition-colors"
          >
            <Heart size={20} />
          </button>
          <Link
            href="/cart"
            aria-label="Cart"
            onClick={() => setDrawerOpen(false)}
            className="relative text-foreground/70 hover:text-accent transition-colors"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
