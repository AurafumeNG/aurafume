'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import AnnouncementStrip from '@/components/announcement-strip';
import Footer from '@/components/footer';

// Strip: 36px (h-9) · Navbar: 64px (h-16) · Combined: 100px (6.25rem)
const STRIP_H = 36;
const NAV_H = 64;

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  // Optimistic: assume strip is visible until sessionStorage says otherwise
  const [stripVisible, setStripVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('announcement-dismissed')) {
      setStripVisible(false);
    }
  }, []);

  const offsetPx = (stripVisible ? STRIP_H : 0) + NAV_H;

  return (
    <>
      {/* Fixed header: strip sits above the navbar, both in one stacked container */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {stripVisible && (
          <AnnouncementStrip onDismiss={() => setStripVisible(false)} />
        )}
        <Navbar />
      </div>

      {/* Spacer that matches the combined fixed header height */}
      <main style={{ paddingTop: offsetPx }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
