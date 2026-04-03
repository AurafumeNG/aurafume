import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-16">

      {/* Logo */}
      <Link href="/" className="mb-10 block">
        <Image
          src="/logo/aurafumeng-logo.png"
          alt="AuraFume"
          width={120}
          height={40}
          className="h-10 w-auto object-contain"
          priority
        />
      </Link>

      {/* Card */}
      <div className="w-full max-w-[400px] border border-border/60 bg-background/60 px-8 py-10">
        {children}
      </div>

    </div>
  );
}
