import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import type { SplMatch } from "@/hooks/useMatches";

interface InningsSummary {
  inningsNumber: number;
  battingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsCurrentOver: number;
  status: string;
  target: number | null;
}

function shortName(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.substring(0, 6).toUpperCase();
  return words.map(w => w[0]).join("").toUpperCase().substring(0, 4);
}

function ovsStr(completed: number, balls: number) {
  return balls === 0 ? `${completed}` : `${completed}.${balls}`;
}

function SlideItem({ match }: { match: SplMatch }) {
  const inn: InningsSummary[] = (match as any).innings ?? [];
  const t1 = match.team1;
  const t2 = match.team2;
  const c1 = t1?.color ?? "#3b82f6";
  const c2 = t2?.color ?? "#f59e0b";

  // Which innings is active (in_progress)?
  const active = inn.find(i => i.status === "in_progress");
  // Both innings (for 2nd innings target context)
  const inn1 = inn.find(i => i.inningsNumber === 1);
  const inn2 = inn.find(i => i.inningsNumber === 2);

  // Build left/right score strings
  const team1Score = inn1 && t1 && inn1.battingTeamId === t1.id
    ? `${inn1.totalRuns}/${inn1.totalWickets}`
    : inn2 && t1 && inn2.battingTeamId === t1.id
    ? `${inn2.totalRuns}/${inn2.totalWickets}`
    : null;

  const team2Score = inn1 && t2 && inn1.battingTeamId === t2.id
    ? `${inn1.totalRuns}/${inn1.totalWickets}`
    : inn2 && t2 && inn2.battingTeamId === t2.id
    ? `${inn2.totalRuns}/${inn2.totalWickets}`
    : null;

  const overs = active
    ? `${ovsStr(active.oversCompleted, active.ballsCurrentOver)}/${match.overs} ov`
    : null;

  // Need X runs context (2nd innings)
  const chasing = inn2 && active && inn2.id === active.id && inn2.target;
  const need = chasing
    ? Math.max(0, inn2!.target! - inn2!.totalRuns)
    : null;
  const ballsLeft = chasing
    ? match.overs * 6 - (inn2!.oversCompleted * 6 + inn2!.ballsCurrentOver)
    : null;

  return (
    <Link href={`/match/${match.id}`}>
      <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0 cursor-pointer group">

        {/* LIVE badge */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-400 hidden xs:block">LIVE</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-white/15 flex-shrink-0" />

        {/* Team 1 */}
        <div className="flex items-center gap-1.5 min-w-0" style={{ maxWidth: "28%" }}>
          <span
            className="text-[10px] sm:text-xs font-heading font-bold tracking-wide truncate"
            style={{ color: c1 }}
          >
            {t1?.name ?? "Team 1"}
          </span>
          {team1Score && (
            <span className="text-[11px] sm:text-sm font-bold text-white font-heading leading-none flex-shrink-0">
              {team1Score}
            </span>
          )}
        </div>

        {/* VS */}
        <span className="text-[8px] font-bold text-white/25 flex-shrink-0">vs</span>

        {/* Team 2 */}
        <div className="flex items-center gap-1.5 min-w-0" style={{ maxWidth: "28%" }}>
          <span
            className="text-[10px] sm:text-xs font-heading font-bold tracking-wide truncate"
            style={{ color: c2 }}
          >
            {t2?.name ?? "Team 2"}
          </span>
          {team2Score && (
            <span className="text-[11px] sm:text-sm font-bold text-white font-heading leading-none flex-shrink-0">
              {team2Score}
            </span>
          )}
        </div>

        {/* Overs */}
        {overs && (
          <>
            <div className="w-px h-4 bg-white/15 flex-shrink-0" />
            <span className="text-[9px] sm:text-[10px] text-white/40 font-semibold flex-shrink-0">{overs}</span>
          </>
        )}

        {/* Need X in Y balls */}
        {need !== null && ballsLeft !== null && (
          <>
            <div className="w-px h-4 bg-white/15 flex-shrink-0 hidden sm:block" />
            <span className="text-[9px] text-primary font-bold flex-shrink-0 hidden sm:block">
              Need {need} ({ballsLeft}b)
            </span>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Tap hint */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity">
          <span className="text-[9px] text-white hidden sm:block">View</span>
          <ChevronRight className="w-3 h-3 text-white" />
        </div>
      </div>
    </Link>
  );
}

interface Props {
  matches: SplMatch[];
}

export function LiveScoreTicker({ matches }: Props) {
  const ongoing = matches.filter(m => m.status === "ongoing");
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setDir(1);
    setIdx(i => (i + 1) % ongoing.length);
  }, [ongoing.length]);

  useEffect(() => {
    if (ongoing.length <= 1) return;
    timerRef.current = setInterval(advance, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ongoing.length, advance]);

  useEffect(() => { setIdx(0); }, [ongoing.length]);

  if (ongoing.length === 0) return null;

  const current = ongoing[idx % ongoing.length];

  const variants = {
    enter: (d: number) => ({ y: d > 0 ? 14 : -14, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (d: number) => ({ y: d > 0 ? -14 : 14, opacity: 0 }),
  };

  return (
    <div
      className="w-full mb-4 rounded-xl overflow-hidden border border-red-500/20"
      style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.07) 0%, rgba(10,15,28,0.95) 30%, rgba(10,15,28,0.95) 70%, rgba(239,68,68,0.07) 100%)" }}
    >
      <div className="flex items-center h-10 sm:h-11 px-3 sm:px-4 gap-2 overflow-hidden">
        {/* Left: count badge if multiple */}
        {ongoing.length > 1 && (
          <div className="flex-shrink-0 flex items-center gap-1 mr-1">
            <span className="text-[9px] font-bold text-red-400/70 tabular-nums">
              {idx + 1}/{ongoing.length}
            </span>
            <div className="w-px h-3 bg-white/10" />
          </div>
        )}

        {/* Animated match info */}
        <div className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center">
          <AnimatePresence initial={false} custom={dir} mode="wait">
            <motion.div
              key={current.id}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full"
            >
              <SlideItem match={current} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom pulse line */}
      <div className="h-[2px] w-full relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)" }}
        />
        <motion.div
          className="absolute top-0 left-0 h-full w-1/3 rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, #ef4444, transparent)" }}
          animate={{ x: ["0%", "300%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}
