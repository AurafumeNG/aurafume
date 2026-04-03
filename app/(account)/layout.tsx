import BottomNavBar from '@/components/shop/bottom-nav';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-screen bg-background pt-14 pb-24">
        {children}
      </main>
      <BottomNavBar />
    </>
  );
}
