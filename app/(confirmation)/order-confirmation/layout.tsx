import BottomNavBar from '@/components/shop/bottom-nav';

export default function ConfirmationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-screen bg-background pb-20 sm:pb-0">
        {children}
      </main>
      <BottomNavBar />
    </>
  );
}
