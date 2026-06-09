import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Shield, LogOut, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBetting } from "@/context/BettingContext";
import { motion, useAnimationControls } from "framer-motion";

const ADMIN_PIN = "6261";

// ── Marketing Ticker ──────────────────────────────────────────────────────────
function MarketingTicker({ text }: { text: string }) {
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;

    const run = async () => {
      while (!cancelRef.current) {
        const cw = containerRef.current?.offsetWidth ?? 300;
        const tw = textRef.current?.offsetWidth ?? 200;
        const distance = cw + tw + 40;
        const duration = Math.max(10, distance / 80); // ~80px/s

        // Snap to start position (text is just off the right edge)
        controls.set({ x: cw + 20 });

        // Scroll to end position (text is just off the left edge)
        await controls.start({
          x: -(tw + 20),
          transition: { duration, ease: "linear" },
        });

        if (cancelRef.current) break;

        // Pause 3.5 seconds before next loop
        await new Promise<void>((r) => setTimeout(r, 3500));
      }
    };

    run();

    return () => {
      cancelRef.current = true;
      controls.stop();
    };
  }, [controls, text]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden mx-3 sm:mx-5 relative"
      style={{ minWidth: 0 }}
    >
      <motion.span
        ref={textRef}
        animate={controls}
        className="inline-block whitespace-nowrap text-[11px] sm:text-xs font-bold"
        style={{
          background: "linear-gradient(90deg, #f97316, #fbbf24, #f97316)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "none",
          letterSpacing: "0.02em",
        }}
      >
        {text}
      </motion.span>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export function Navbar() {
  const { user, logout } = useBetting();
  const [clickCount, setClickCount] = useState(0);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState(false);
  const [, setLocation] = useLocation();
  const [headline, setHeadline] = useState<string | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Fetch marketing headline on mount (poll every 30s in case admin changes it)
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/spl-settings/marketing", { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          setHeadline(data.headline ?? null);
        }
      } catch {}
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 10) {
      setPin(["", "", "", ""]);
      setPinError(false);
      setPinOpen(true);
      setClickCount(0);
    }
  };

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setPinError(false);
    if (value && index < 3) inputRefs[index + 1].current?.focus();
    if (next.every(d => d !== "") && next.join("").length === 4) {
      setTimeout(() => verifyPin(next.join("")), 50);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const verifyPin = (code: string) => {
    if (code === ADMIN_PIN) {
      sessionStorage.setItem("splAdmin", "1");
      setPinOpen(false);
      setLocation("/admin");
    } else {
      setPinError(true);
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs[0].current?.focus(), 50);
    }
  };

  const handleSubmitPin = () => verifyPin(pin.join(""));

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 flex h-14 items-center gap-2">

          {/* Left — SPL Logo */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 flex-shrink-0">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl sm:text-3xl tracking-wide text-white uppercase mt-1">
              S<span className="text-primary">P</span>L
            </span>
          </Link>

          {/* Centre — Marketing Ticker (only when headline is set) */}
          {headline && <MarketingTicker text={headline} />}

          {/* Right — user info + Privacy Policy */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-auto">
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                  <User className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-white/70 text-xs font-semibold max-w-[80px] truncate">{user.name}</span>
                  <span className="text-yellow-400 text-xs font-bold">₹{user.balance}</span>
                </div>
                <button onClick={handleLogout} className="text-white/30 hover:text-white/70 transition-colors p-1" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={handleSecretClick}
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </nav>

      {/* PIN Modal */}
      <Dialog open={pinOpen} onOpenChange={(v) => { if (!v) setPinOpen(false); }}>
        <DialogContent className="max-w-xs bg-[#0d1425] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wide uppercase text-primary text-center">
              Admin Access
            </DialogTitle>
          </DialogHeader>
          <div className="text-center mt-2">
            <Shield className="w-10 h-10 text-primary/60 mx-auto mb-3" />
            <p className="text-white/60 text-sm mb-5">Enter 4-digit PIN to continue</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinInput(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-2xl font-heading rounded-lg border bg-black/40 text-white outline-none transition-all
                    ${pinError ? "border-red-500 bg-red-500/10" : digit ? "border-primary bg-primary/10" : "border-white/20 focus:border-primary"}`}
                />
              ))}
            </div>
            {pinError && (
              <p className="text-red-400 text-sm mb-3 font-semibold">Incorrect PIN. Try again.</p>
            )}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" className="border-white/20 text-white" onClick={() => setPinOpen(false)}>Cancel</Button>
              <Button size="sm" className="bg-primary text-black font-bold" onClick={handleSubmitPin} disabled={pin.some(d => !d)}>Enter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
