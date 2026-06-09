import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import type { SplMatch } from "@/hooks/useMatches";

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(matchDate: string | null) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0, total: -1 });

  useEffect(() => {
    if (!matchDate) { setParts({ d: 0, h: 0, m: 0, s: 0, total: -1 }); return; }
    const tick = () => {
      const diff = new Date(matchDate).getTime() - Date.now();
      if (diff <= 0) { setParts({ d: 0, h: 0, m: 0, s: 0, total: 0 }); return; }
      setParts({
        total: diff,
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [matchDate]);

  return parts;
}

// ── Single banner slide ───────────────────────────────────────────────────────
function BannerSlide({ match }: { match: SplMatch }) {
  const { d, h, m, s, total } = useCountdown(match.matchDate);
  const t1 = match.team1;
  const t2 = match.team2;
  const c1 = t1?.color ?? "#3b82f6";
  const c2 = t2?.color ?? "#f59e0b";
  const pad = (n: number) => String(n).padStart(2, "0");

  const matchDay = match.matchDate
    ? new Date(match.matchDate).toLocaleDateString("en-IN", {
        weekday: "short", day: "numeric", month: "short",
      })
    : null;
  const matchTime = match.matchDate
    ? new Date(match.matchDate).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border select-none"
      style={{
        background: `linear-gradient(135deg, ${c1}18 0%, #0a0f1c 40%, #0a0f1c 60%, ${c2}18 100%)`,
        borderColor: `${c1}30`,
        minHeight: 0,
      }}
    >
      {/* top accent bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }}
      />

      {/* Background diagonal strips */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            -55deg,
            white 0px, white 1px,
            transparent 1px, transparent 24px
          )`,
        }}
      />

      <div className="relative z-10 px-4 sm:px-6 py-4 sm:py-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: c1 }}
            />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Upcoming Match
            </span>
          </div>
          <div className="flex items-center gap-3 text-[9px] sm:text-[10px] text-white/40">
            {match.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                <span className="font-semibold">{match.venue}</span>
              </span>
            )}
            <span className="font-semibold">{match.overs} Overs</span>
          </div>
        </div>

        {/* Teams + VS + Countdown */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Team 1 */}
          <div className="flex-1 min-w-0">
            <div
              className="inline-block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-1.5"
              style={{ background: `${c1}25`, color: c1 }}
            >
              {t1?.location ?? "Team 1"}
            </div>
            <div className="font-heading text-xl sm:text-3xl lg:text-4xl text-white leading-none tracking-wide truncate">
              {t1?.name ?? "Team 1"}
            </div>
          </div>

          {/* VS + Countdown block */}
          <div className="flex flex-col items-center flex-shrink-0 px-2 sm:px-4">
            {/* VS badge */}
            <div
              className="font-heading text-base sm:text-xl font-black tracking-widest mb-2 sm:mb-3"
              style={{
                background: `linear-gradient(135deg, ${c1}, ${c2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              VS
            </div>

            {/* Countdown */}
            {total > 0 ? (
              <div className="flex items-end gap-1 sm:gap-1.5">
                {d > 0 && (
                  <>
                    <CountUnit value={pad(d)} label="d" color={c1} />
                    <span className="text-white/30 text-sm font-bold mb-3">:</span>
                  </>
                )}
                <CountUnit value={pad(h)} label="h" color={c1} />
                <span className="text-white/30 text-sm font-bold mb-3">:</span>
                <CountUnit value={pad(m)} label="m" color={c2} />
                <span className="text-white/30 text-sm font-bold mb-3">:</span>
                <CountUnit value={pad(s)} label="s" color={c2} />
              </div>
            ) : total === 0 ? (
              <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-lg px-2.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Starting</span>
              </div>
            ) : (
              <div className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">TBD</div>
            )}

            {/* Date + Time */}
            {matchDay && (
              <div className="mt-2 flex items-center gap-1 text-[9px] sm:text-[10px] text-white/35 font-semibold">
                <Clock className="w-2.5 h-2.5" />
                <span>{matchDay} · {matchTime}</span>
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex-1 min-w-0 text-right">
            <div
              className="inline-block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-1.5"
              style={{ background: `${c2}25`, color: c2 }}
            >
              {t2?.location ?? "Team 2"}
            </div>
            <div className="font-heading text-xl sm:text-3xl lg:text-4xl text-white leading-none tracking-wide truncate">
              {t2?.name ?? "Team 2"}
            </div>
          </div>
        </div>
      </div>

      {/* bottom accent */}
      <div
        className="h-[1px] w-full opacity-20"
        style={{ background: `linear-gradient(90deg, transparent, ${c1}, ${c2}, transparent)` }}
      />
    </div>
  );
}

function CountUnit({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="font-heading text-lg sm:text-2xl leading-none rounded px-1.5 py-1 min-w-[32px] sm:min-w-[40px] text-center"
        style={{ background: `${color}18`, color: "white", border: `1px solid ${color}25` }}
      >
        {value}
      </div>
      <span className="text-[7px] sm:text-[8px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

// ── Main exported banner ──────────────────────────────────────────────────────
interface Props {
  matches: SplMatch[];
}

export function UpcomingMatchBanner({ matches }: Props) {
  // Only show upcoming matches with a future matchDate, sorted soonest first
  const upcoming = matches
    .filter(m => m.status === "upcoming" && m.matchDate)
    .sort((a, b) => new Date(a.matchDate!).getTime() - new Date(b.matchDate!).getTime());

  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((next: number, direction: 1 | -1) => {
    setDir(direction);
    setIdx(next);
  }, []);

  const next = useCallback(() => {
    go((idx + 1) % upcoming.length, 1);
  }, [idx, upcoming.length, go]);

  const prev = useCallback(() => {
    go((idx - 1 + upcoming.length) % upcoming.length, -1);
  }, [idx, upcoming.length, go]);

  // Auto-advance every 6 seconds when there are multiple
  useEffect(() => {
    if (upcoming.length <= 1) return;
    timerRef.current = setInterval(next, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [upcoming.length, next]);

  // Reset index if matches change
  useEffect(() => {
    setIdx(0);
  }, [upcoming.length]);

  if (upcoming.length === 0) return null;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "60%" : "-60%", opacity: 0 }),
    center: { x: "0%", opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0 }),
  };

  return (
    <div className="w-full mb-5 sm:mb-6">
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
          Next Match{upcoming.length > 1 ? `es · ${upcoming.length} Scheduled` : ""}
        </span>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden rounded-2xl">
          <AnimatePresence initial={false} custom={dir} mode="wait">
            <motion.div
              key={upcoming[idx].id}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              <BannerSlide match={upcoming[idx]} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows — only when multiple */}
        {upcoming.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 border border-white/10 text-white/50 hover:text-white hover:bg-black/80 flex items-center justify-center transition-all z-10 backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 border border-white/10 text-white/50 hover:text-white hover:bg-black/80 flex items-center justify-center transition-all z-10 backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {upcoming.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {upcoming.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > idx ? 1 : -1)}
              className="rounded-full transition-all"
              style={{
                width: i === idx ? 20 : 6,
                height: 6,
                background: i === idx
                  ? (upcoming[i].team1?.color ?? "#f97316")
                  : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
