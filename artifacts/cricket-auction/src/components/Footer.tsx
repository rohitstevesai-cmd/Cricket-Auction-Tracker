import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useBetting } from "@/context/BettingContext";
import { BettingAuthModal } from "@/components/betting/BettingAuthModal";

export function Footer() {
  const { user, isAdmin } = useBetting();
  const [, setLocation] = useLocation();
  const [clickCount, setClickCount] = useState(0);
  const [bettingAuthOpen, setBettingAuthOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCreatorClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setClickCount(0), 2000);

    if (newCount >= 5) {
      setClickCount(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isAdmin) {
        setLocation("/betting-admin");
      } else if (user) {
        setLocation("/betting");
      } else {
        setBettingAuthOpen(true);
      }
    }
  };

  return (
    <>
      <footer className="w-full border-t border-white/5 py-3 mt-auto">
        <p
          className="text-center text-[11px] text-white/25 tracking-wide select-none cursor-default"
          onClick={handleCreatorClick}
        >
          Created by{" "}
          <span className="text-white/40 font-semibold">Rohit Mukati</span>
          {" "}&amp;{" "}
          <span className="text-white/40 font-semibold">Yash Rathore</span>
        </p>
      </footer>

      <BettingAuthModal open={bettingAuthOpen} onClose={() => setBettingAuthOpen(false)} />
    </>
  );
}
