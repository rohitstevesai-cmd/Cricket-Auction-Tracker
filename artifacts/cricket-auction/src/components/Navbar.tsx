import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";

export function Navbar() {
  const [clickCount, setClickCount] = useState(0);
  const [, setLocation] = useLocation();

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 10) {
      setLocation("/admin");
      setClickCount(0);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
          <Shield className="h-8 w-8 text-primary" />
          <span className="font-heading text-2xl sm:text-3xl tracking-wide text-white uppercase mt-1">Auction<span className="text-primary">X</span><span className="text-white/40 text-base sm:text-lg ml-1.5">SPL</span></span>
        </Link>
        <div className="flex items-center gap-6">
          <button
            onClick={handleSecretClick}
            className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </nav>
  );
}
