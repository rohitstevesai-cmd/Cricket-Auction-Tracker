import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useData } from "@/context/DataContext";
import { useScorecard, SplInnings, SplBall, BatsmanStat, BowlerStat } from "@/hooks/useMatches";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, LineChart, Line, Legend, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { ArrowLeft, Zap, Trophy, RotateCcw, CheckCircle2, ChevronDown, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtOvers(ov: number, balls: number) {
  return `${ov}.${balls}`;
}
function sr(runs: number, balls: number) {
  return balls === 0 ? "0.00" : ((runs / balls) * 100).toFixed(1);
}
function economy(runs: number, balls: number) {
  return balls === 0 ? "0.00" : ((runs / (balls / 6))).toFixed(2);
}
function fmtBowlerOvers(balls: number) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}
function ballSymbol(b: SplBall): { label: string; color: string } {
  if (b.isWicket) return { label: "W", color: "bg-red-500 text-white" };
  if (b.extrasType === "wide") return { label: "Wd", color: "bg-yellow-500/80 text-black" };
  if (b.extrasType === "noball") return { label: "Nb", color: "bg-orange-500 text-white" };
  if (b.extrasType === "bye") return { label: "B", color: "bg-slate-500 text-white" };
  if (b.extrasType === "legbye") return { label: "Lb", color: "bg-slate-500 text-white" };
  const r = b.runsOffBat;
  if (r === 4) return { label: "4", color: "bg-blue-500 text-white" };
  if (r === 6) return { label: "6", color: "bg-purple-500 text-white" };
  if (r === 0) return { label: "·", color: "bg-white/10 text-white/60" };
  return { label: String(r), color: "bg-emerald-600 text-white" };
}
function dismissalText(stat: any): string {
  if (!stat.isOut) return "not out";
  const db = stat.dismissedBy?.name?.split(" ").slice(-1)[0] ?? "?";
  const fl = stat.fielder?.name?.split(" ").slice(-1)[0];
  switch (stat.dismissalType) {
    case "bowled": return `b ${db}`;
    case "caught": return `c ${fl ?? "?"} b ${db}`;
    case "lbw": return `lbw b ${db}`;
    case "runout": return fl ? `run out (${fl})` : "run out";
    case "stumped": return `st ${fl ?? "?"} b ${db}`;
    case "hitwicket": return `hit wicket b ${db}`;
    default: return stat.dismissalType ?? "out";
  }
}

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    let videoId = "";
    if (u.hostname === "youtu.be" || u.hostname === "www.youtu.be") {
      videoId = u.pathname.slice(1).split("?")[0];
    } else if (u.hostname.includes("youtube.com")) {
      videoId = u.searchParams.get("v") || "";
      if (!videoId) {
        const parts = u.pathname.split("/").filter(Boolean);
        const idx = parts.findIndex(p => ["embed", "live", "shorts"].includes(p));
        if (idx !== -1) videoId = parts[idx + 1] || "";
        else if (parts.length) videoId = parts[parts.length - 1] || "";
      }
    }
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  } catch {
    return null;
  }
}

// ── BallDot Component ────────────────────────────────────────────────────────
function BallDot({ ball, small }: { ball: SplBall; small?: boolean }) {
  const { label, color } = ballSymbol(ball);
  const size = small ? "w-5 h-5 text-[8px]" : "w-8 h-8 text-[11px]";
  return (
    <div className={`${size} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${color}`}>
      {label}
    </div>
  );
}

// ── Live Score Ticker ─────────────────────────────────────────────────────────
function LiveScoreTicker({ activeInnings, bat1, bat2, strikerId, lastOutName, currentBowler, bowlerNameOverride }: {
  activeInnings: SplInnings;
  bat1: any | null;
  bat2: any | null;
  strikerId: string | null;
  lastOutName?: string | null;
  currentBowler: any | null;
  bowlerNameOverride?: string | null;
}) {
  const bat1IsStriker = !!(bat1 && bat1.playerId === strikerId);
  const bat2IsStriker = !!(bat2 && bat2.playerId === strikerId);
  const totalBalls = activeInnings.oversCompleted * 6 + activeInnings.ballsCurrentOver;
  const crr = totalBalls > 0 ? (activeInnings.totalRuns / (totalBalls / 6)).toFixed(2) : "0.00";
  const teamColor = activeInnings.battingTeam?.color || "#3b82f6";

  const BatRow = ({ stat, isStriker, strikethrough }: { stat: any; isStriker: boolean; strikethrough?: boolean }) => {
    const srStr = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(0) : "—";
    return (
      <div className={`flex items-center gap-1.5 py-1 rounded-lg transition-colors ${isStriker ? "" : ""}`}
        style={isStriker ? { background: "rgba(255,255,255,0.04)" } : {}}>
        <div className="w-3 flex-shrink-0 flex items-center justify-center">
          {isStriker
            ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            : <div className="w-1.5 h-1.5 rounded-full bg-white/15" />}
        </div>
        <span className={`text-[12px] flex-1 min-w-0 truncate ${isStriker ? "font-bold text-white" : "font-medium text-white/65"} ${strikethrough ? "line-through opacity-40" : ""}`}>
          {stat.player?.name ?? "—"}
          {isStriker && !strikethrough && <span className="text-red-400 ml-0.5">*</span>}
        </span>
        <span className={`w-8 text-right tabular-nums flex-shrink-0 ${isStriker ? "font-black text-white text-[13px]" : "text-white/60 text-[12px]"}`}>{stat.runs}</span>
        <span className="w-8 text-right text-white/45 text-[11px] tabular-nums flex-shrink-0">({stat.balls})</span>
        <span className={`w-10 text-right text-[10px] font-bold tabular-nums flex-shrink-0 ${isStriker ? "text-amber-400" : "text-white/25"}`}>{srStr}</span>
      </div>
    );
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mb-3" style={{
      background: "linear-gradient(160deg, #0c1a2e 0%, #081220 100%)",
    }}>
      {/* ── Header: Team + Score ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8"
        style={{ background: "rgba(255,255,255,0.03)" }}>
        {activeInnings.battingTeam?.logo ? (
          <img src={activeInnings.battingTeam.logo} alt="" className="w-6 h-6 object-contain rounded flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: teamColor }} />
        )}
        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest truncate flex-1">
          {activeInnings.battingTeam?.name ?? "Batting"}
        </span>
        <div className="flex items-baseline gap-1.5 flex-shrink-0">
          <span className="font-heading text-[22px] font-black text-white leading-none tabular-nums">
            {activeInnings.totalRuns}/{activeInnings.totalWickets}
          </span>
          <div className="text-right leading-tight">
            <div className="text-white/45 text-[10px] tabular-nums">
              Ov {activeInnings.oversCompleted}.{activeInnings.ballsCurrentOver}
            </div>
            <div className="text-[10px] font-bold" style={{ color: teamColor }}>
              CRR {crr}
            </div>
          </div>
          {activeInnings.target != null && (
            <div className="ml-1 text-[11px] font-black text-amber-400 leading-tight text-right">
              Need<br/>{Math.max(0, activeInnings.target - activeInnings.totalRuns)}
            </div>
          )}
        </div>
      </div>

      {/* ── Batsmen Rows ── */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="flex items-center mb-1">
          <div className="w-3 flex-shrink-0" />
          <div className="flex-1 min-w-0" />
          <div className="w-8 text-right text-[9px] text-white/25 uppercase tracking-wide flex-shrink-0">R</div>
          <div className="w-8 text-right text-[9px] text-white/25 uppercase tracking-wide flex-shrink-0">B</div>
          <div className="w-10 text-right text-[9px] text-white/25 uppercase tracking-wide flex-shrink-0">SR</div>
        </div>

        {/* Row 1 */}
        {bat1
          ? <BatRow stat={bat1} isStriker={bat1IsStriker} />
          : lastOutName
            ? <div className="flex items-center gap-1.5 py-1">
                <div className="w-3 flex-shrink-0 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-red-500/40" /></div>
                <span className="text-white/30 text-[12px] line-through flex-1 truncate">{lastOutName}</span>
                <span className="text-[10px] text-white/25 italic">Out</span>
              </div>
            : <div className="flex items-center gap-1.5 py-1">
                <div className="w-3" /><span className="text-white/25 text-[11px] italic">Waiting...</span>
              </div>}

        {/* Row 2 */}
        {bat2
          ? <BatRow stat={bat2} isStriker={bat2IsStriker} />
          : <div className="flex items-center gap-1.5 py-1">
              <div className="w-3" /><span className="text-white/20 text-[11px] italic">New batsman...</span>
            </div>}
      </div>

      {/* ── Bowler + This Over ── */}
      <div className="flex items-center gap-2 px-3 py-2">
        {currentBowler ? (
          <>
            <span className="text-[10px] flex-shrink-0">🎳</span>
            <span className="font-bold text-white/80 text-[11px] flex-shrink-0 max-w-[120px] truncate">
              {currentBowler.player?.name ?? "—"}
            </span>
            <span className="text-white/35 text-[10px] flex-shrink-0 tabular-nums">
              {fmtBowlerOvers(currentBowler.balls)}-{currentBowler.wickets}-{currentBowler.runs}
            </span>
            {activeInnings.currentOverBalls.length > 0 && (
              <div className="ml-auto flex gap-1 flex-wrap justify-end">
                {activeInnings.currentOverBalls.slice(-6).map(b => (
                  <BallDot key={b.id} ball={b} small />
                ))}
              </div>
            )}
          </>
        ) : bowlerNameOverride ? (
          <>
            <span className="text-[10px] flex-shrink-0">🎳</span>
            <span className="font-bold text-white/80 text-[11px] flex-shrink-0 max-w-[120px] truncate">{bowlerNameOverride}</span>
            <span className="text-white/35 text-[10px] flex-shrink-0">0-0-0</span>
          </>
        ) : (
          <span className="text-white/25 text-[11px]">Waiting for bowler...</span>
        )}
      </div>
    </div>
  );
}

// ── YouTube Live Card ─────────────────────────────────────────────────────────
function YouTubeCard({ url }: { url: string }) {
  const embedUrl = getYoutubeEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black border border-red-500/20 mb-4" style={{ aspectRatio: "16/9" }}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="Live Match Stream"
      />
    </div>
  );
}

// ── InningsScorecard ─────────────────────────────────────────────────────────
function InningsScorecard({ inn, matchOvers }: { inn: SplInnings; matchOvers: number }) {
  const isOngoing = inn.status === "in_progress";
  const crr = inn.oversCompleted > 0 || inn.ballsCurrentOver > 0
    ? (inn.totalRuns / ((inn.oversCompleted * 6 + inn.ballsCurrentOver) / 6)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-4">
      {/* Batting */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-3 py-2 bg-black/30 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {inn.battingTeam?.logo ? (
              <img src={inn.battingTeam.logo} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: inn.battingTeam?.color }} />
            )}
            <span className="font-heading text-sm text-white uppercase tracking-wider">{inn.battingTeam?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="font-bold text-white">{inn.totalRuns}/{inn.totalWickets}</span>
            <span>({fmtOvers(inn.oversCompleted, inn.ballsCurrentOver)} ov)</span>
            <span className="text-white/40">CRR: {crr}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" style={{ minWidth: 400 }}>
            <thead className="bg-black/20 text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-3 py-2">Batsman</th>
                <th className="px-3 py-2 text-right">R</th>
                <th className="px-3 py-2 text-right">B</th>
                <th className="px-3 py-2 text-right">4s</th>
                <th className="px-3 py-2 text-right">6s</th>
                <th className="px-3 py-2 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inn.batsmenStats.map((s) => (
                <tr key={s.playerId} className="hover:bg-white/5">
                  <td className="px-3 py-2">
                    <div>
                      <span className="font-semibold text-white">{s.player?.name ?? s.playerId}</span>
                      <span className="text-white/40 ml-2 text-[10px]">{dismissalText(s)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-white">{s.runs}</td>
                  <td className="px-3 py-2 text-right text-white/60">{s.balls}</td>
                  <td className="px-3 py-2 text-right text-blue-400">{s.fours}</td>
                  <td className="px-3 py-2 text-right text-purple-400">{s.sixes}</td>
                  <td className="px-3 py-2 text-right text-white/60">{sr(s.runs, s.balls)}</td>
                </tr>
              ))}
              {isOngoing && (
                <tr className="bg-white/3">
                  <td colSpan={6} className="px-3 py-2 text-white/30 text-[10px] italic">— innings in progress —</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bowling */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-3 py-2 bg-black/30 border-b border-white/10">
          <span className="font-heading text-sm text-white/60 uppercase tracking-wider">Bowling — {inn.bowlingTeam?.name}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" style={{ minWidth: 340 }}>
            <thead className="bg-black/20 text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-3 py-2">Bowler</th>
                <th className="px-3 py-2 text-right">O</th>
                <th className="px-3 py-2 text-right">R</th>
                <th className="px-3 py-2 text-right">W</th>
                <th className="px-3 py-2 text-right">Eco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inn.bowlerStats.map((s) => (
                <tr key={s.playerId} className="hover:bg-white/5">
                  <td className="px-3 py-2 font-semibold text-white">{s.player?.name ?? s.playerId}</td>
                  <td className="px-3 py-2 text-right text-white/60">{fmtBowlerOvers(s.balls)}</td>
                  <td className="px-3 py-2 text-right text-white/60">{s.runs}</td>
                  <td className="px-3 py-2 text-right font-bold text-red-400">{s.wickets}</td>
                  <td className="px-3 py-2 text-right text-white/60">{economy(s.runs, s.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Team Comparison Panel ─────────────────────────────────────────────────────
function TeamComparison({ inn1, inn2, matchOvers }: { inn1: SplInnings; inn2: SplInnings; matchOvers: number }) {
  const [tab, setTab] = useState<"stars" | "dna" | "breakdown">("stars");

  const t1Color = inn1.battingTeam?.color ?? "#3b82f6";
  const t2Color = inn2.battingTeam?.color ?? "#f59e0b";
  const t1Name = inn1.battingTeam?.name ?? "Team 1";
  const t2Name = inn2.battingTeam?.name ?? "Team 2";

  const balls1 = inn1.balls ?? [];
  const balls2 = inn2.balls ?? [];

  // ── Star player helpers ──
  const topBatter = (inn: SplInnings): BatsmanStat | null =>
    (inn.batsmenStats ?? []).reduce((best: BatsmanStat | null, s) =>
      !best || s.runs > best.runs || (s.runs === best.runs && s.balls < best.balls) ? s : best, null);

  const topBowler = (inn: SplInnings): BowlerStat | null =>
    (inn.bowlerStats ?? []).filter(s => s.balls > 0).reduce((best: BowlerStat | null, s) => {
      if (!best) return s;
      if (s.wickets > best.wickets) return s;
      if (s.wickets === best.wickets && s.economy < best.economy) return s;
      return best;
    }, null);

  // t1 batted in inn1, t2 batted in inn2
  // t2 bowled in inn1, t1 bowled in inn2
  const t1TopBat = topBatter(inn1);
  const t2TopBat = topBatter(inn2);
  const t2TopBowl = topBowler(inn1); // team2 bowled in inn1
  const t1TopBowl = topBowler(inn2); // team1 bowled in inn2

  // ── DNA helpers ──
  const dna = (balls: any[], inn: SplInnings) => {
    const legal = balls.filter(b => b.extrasType !== "wide" && b.extrasType !== "noball");
    const fours = balls.filter(b => b.runsOffBat === 4).length;
    const sixes = balls.filter(b => b.runsOffBat === 6).length;
    const dots = legal.filter(b => (b.runsOffBat ?? 0) === 0).length;
    const totalLegal = legal.length || 1;
    const extras = balls.reduce((a: number, b: any) => a + (b.extras ?? 0), 0);
    const sr = totalLegal > 0 ? Math.round((inn.totalRuns / totalLegal) * 100) : 0;
    return { fours, sixes, dots, dotPct: Math.round((dots / totalLegal) * 100), extras, sr };
  };

  const d1 = dna(balls1, inn1);
  const d2 = dna(balls2, inn2);

  // Radar data — normalise to 0-100 scale
  const normalise = (v: number, max: number) => max > 0 ? Math.round((v / max) * 100) : 0;
  const radarData = [
    { metric: "Strike Rate", t1: normalise(d1.sr, Math.max(d1.sr, d2.sr) || 1), t2: normalise(d2.sr, Math.max(d1.sr, d2.sr) || 1) },
    { metric: "Sixes", t1: normalise(d1.sixes, Math.max(d1.sixes, d2.sixes) || 1), t2: normalise(d2.sixes, Math.max(d1.sixes, d2.sixes) || 1) },
    { metric: "Fours", t1: normalise(d1.fours, Math.max(d1.fours, d2.fours) || 1), t2: normalise(d2.fours, Math.max(d1.fours, d2.fours) || 1) },
    { metric: "Total Runs", t1: normalise(inn1.totalRuns, Math.max(inn1.totalRuns, inn2.totalRuns) || 1), t2: normalise(inn2.totalRuns, Math.max(inn1.totalRuns, inn2.totalRuns) || 1) },
    { metric: "Dot Free%", t1: 100 - d1.dotPct, t2: 100 - d2.dotPct },
    { metric: "Wickets Saved", t1: normalise(10 - inn1.totalWickets, 10), t2: normalise(10 - inn2.totalWickets, 10) },
  ];

  // ── Breakdown bars ──
  const breakdownCats = [
    { label: "Fours 🏏", t1v: d1.fours, t2v: d2.fours },
    { label: "Sixes 💥", t1v: d1.sixes, t2v: d2.sixes },
    { label: "Extras", t1v: d1.extras, t2v: d2.extras },
    { label: "Dot balls", t1v: d1.dots, t2v: d2.dots },
  ];

  const tabs = [
    { key: "stars", label: "🏆 Stars" },
    { key: "dna", label: "🕸 Team DNA" },
    { key: "breakdown", label: "⚡ Breakdown" },
  ] as const;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Team Comparison</p>
        {/* Legend */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-white/55">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t1Color }} /> {t1Name}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/55">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t2Color }} /> {t2Name}
          </span>
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex gap-1.5 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all border ${
              tab === t.key
                ? "bg-primary/20 border-primary/50 text-primary"
                : "border-white/10 text-white/35 hover:text-white/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── TAB 1: Stars of the Match ── */}
        {tab === "stars" && (
          <motion.div key="stars" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {(t1TopBat || t2TopBat) ? (
              <div className="space-y-3">
                {/* ── Section label ── */}
                <p className="text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-3 h-px bg-white/15 inline-block" />🏏 Top Batsman<span className="flex-1 h-px bg-white/15 inline-block" />
                </p>

                {/* Batsman duel */}
                <div className="grid grid-cols-2 gap-2">
                  {/* T1 top bat */}
                  {(() => {
                    const s = t1TopBat;
                    const srStr = s && s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : "—";
                    const batLeads = !t2TopBat || (s?.runs ?? 0) >= (t2TopBat?.runs ?? 0);
                    return (
                      <div className="relative rounded-xl p-3 border overflow-hidden"
                        style={{ borderColor: `${t1Color}30`, background: `linear-gradient(135deg, ${t1Color}12 0%, transparent 60%)` }}>
                        {batLeads && (
                          <div className="absolute top-2 right-2 text-[9px] font-black text-yellow-400 tracking-wide">⭐ MVP</div>
                        )}
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: t1Color }}>{t1Name}</p>
                        {s ? (
                          <>
                            <p className="text-[13px] font-bold text-white truncate leading-tight mb-1">{s.player?.name ?? "—"}</p>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="font-heading text-[28px] font-black leading-none" style={{ color: t1Color }}>{s.runs}</span>
                              <span className="text-white/40 text-[11px]">({s.balls}b)</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-[9px] bg-white/8 rounded px-1.5 py-0.5 text-white/60">SR {srStr}</span>
                              {s.fours > 0 && <span className="text-[9px] bg-blue-500/15 rounded px-1.5 py-0.5 text-blue-300">{s.fours}×4</span>}
                              {s.sixes > 0 && <span className="text-[9px] bg-purple-500/15 rounded px-1.5 py-0.5 text-purple-300">{s.sixes}×6</span>}
                              {!s.isOut && <span className="text-[9px] bg-emerald-500/15 rounded px-1.5 py-0.5 text-emerald-400">N/O</span>}
                            </div>
                          </>
                        ) : <p className="text-white/25 text-[11px] italic mt-2">No data yet</p>}
                      </div>
                    );
                  })()}

                  {/* T2 top bat */}
                  {(() => {
                    const s = t2TopBat;
                    const srStr = s && s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : "—";
                    const batLeads = !t1TopBat || (s?.runs ?? 0) > (t1TopBat?.runs ?? 0);
                    return (
                      <div className="relative rounded-xl p-3 border overflow-hidden"
                        style={{ borderColor: `${t2Color}30`, background: `linear-gradient(135deg, ${t2Color}12 0%, transparent 60%)` }}>
                        {batLeads && (
                          <div className="absolute top-2 right-2 text-[9px] font-black text-yellow-400 tracking-wide">⭐ MVP</div>
                        )}
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: t2Color }}>{t2Name}</p>
                        {s ? (
                          <>
                            <p className="text-[13px] font-bold text-white truncate leading-tight mb-1">{s.player?.name ?? "—"}</p>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="font-heading text-[28px] font-black leading-none" style={{ color: t2Color }}>{s.runs}</span>
                              <span className="text-white/40 text-[11px]">({s.balls}b)</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-[9px] bg-white/8 rounded px-1.5 py-0.5 text-white/60">SR {srStr}</span>
                              {s.fours > 0 && <span className="text-[9px] bg-blue-500/15 rounded px-1.5 py-0.5 text-blue-300">{s.fours}×4</span>}
                              {s.sixes > 0 && <span className="text-[9px] bg-purple-500/15 rounded px-1.5 py-0.5 text-purple-300">{s.sixes}×6</span>}
                              {!s.isOut && <span className="text-[9px] bg-emerald-500/15 rounded px-1.5 py-0.5 text-emerald-400">N/O</span>}
                            </div>
                          </>
                        ) : <p className="text-white/25 text-[11px] italic mt-2">No data yet</p>}
                      </div>
                    );
                  })()}
                </div>

                {/* ── Bowler section ── */}
                <p className="text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                  <span className="w-3 h-px bg-white/15 inline-block" />🎯 Top Bowler<span className="flex-1 h-px bg-white/15 inline-block" />
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {/* T1 top bowler — team1 bowled in inn2 */}
                  {(() => {
                    const s = t1TopBowl;
                    const ovs = s ? `${Math.floor(s.balls / 6)}.${s.balls % 6}` : "0.0";
                    const bowlLeads = !t2TopBowl || (s?.wickets ?? 0) > (t2TopBowl?.wickets ?? 0) ||
                      ((s?.wickets ?? 0) === (t2TopBowl?.wickets ?? 0) && (s?.economy ?? 99) <= (t2TopBowl?.economy ?? 99));
                    return (
                      <div className="relative rounded-xl p-3 border overflow-hidden"
                        style={{ borderColor: `${t1Color}30`, background: `linear-gradient(135deg, ${t1Color}12 0%, transparent 60%)` }}>
                        {bowlLeads && s && s.wickets > 0 && (
                          <div className="absolute top-2 right-2 text-[9px] font-black text-yellow-400 tracking-wide">⭐ MVP</div>
                        )}
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: t1Color }}>{t1Name}</p>
                        {s ? (
                          <>
                            <p className="text-[13px] font-bold text-white truncate leading-tight mb-1">{s.player?.name ?? "—"}</p>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="font-heading text-[28px] font-black leading-none" style={{ color: t1Color }}>{s.wickets}</span>
                              <span className="text-white/40 text-[11px]">wkts</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-[9px] bg-white/8 rounded px-1.5 py-0.5 text-white/60">Eco {s.economy.toFixed(1)}</span>
                              <span className="text-[9px] bg-white/8 rounded px-1.5 py-0.5 text-white/60">{ovs} ov</span>
                              <span className="text-[9px] bg-white/8 rounded px-1.5 py-0.5 text-white/60">{s.runs}R</span>
                            </div>
                          </>
                        ) : <p className="text-white/25 text-[11px] italic mt-2">No data yet</p>}
                      </div>
                    );
                  })()}

                  {/* T2 top bowler — team2 bowled in inn1 */}
                  {(() => {
                    const s = t2TopBowl;
                    const ovs = s ? `${Math.floor(s.balls / 6)}.${s.balls % 6}` : "0.0";
                    const bowlLeads = !t1TopBowl || (s?.wickets ?? 0) > (t1TopBowl?.wickets ?? 0) ||
                      ((s?.wickets ?? 0) === (t1TopBowl?.wickets ?? 0) && (s?.economy ?? 99) < (t1TopBowl?.economy ?? 99));
                    return (
                      <div className="relative rounded-xl p-3 border overflow-hidden"
                        style={{ borderColor: `${t2Color}30`, background: `linear-gradient(135deg, ${t2Color}12 0%, transparent 60%)` }}>
                        {bowlLeads && s && s.wickets > 0 && (
                          <div className="absolute top-2 right-2 text-[9px] font-black text-yellow-400 tracking-wide">⭐ MVP</div>
                        )}
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: t2Color }}>{t2Name}</p>
                        {s ? (
                          <>
                            <p className="text-[13px] font-bold text-white truncate leading-tight mb-1">{s.player?.name ?? "—"}</p>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="font-heading text-[28px] font-black leading-none" style={{ color: t2Color }}>{s.wickets}</span>
                              <span className="text-white/40 text-[11px]">wkts</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-[9px] bg-white/8 rounded px-1.5 py-0.5 text-white/60">Eco {s.economy.toFixed(1)}</span>
                              <span className="text-[9px] bg-white/8 rounded px-1.5 py-0.5 text-white/60">{ovs} ov</span>
                              <span className="text-[9px] bg-white/8 rounded px-1.5 py-0.5 text-white/60">{s.runs}R</span>
                            </div>
                          </>
                        ) : <p className="text-white/25 text-[11px] italic mt-2">No data yet</p>}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <p className="text-white/25 text-xs text-center py-8">Match data loading...</p>
            )}
          </motion.div>
        )}

        {/* ── TAB 2: Team DNA Radar ── */}
        {tab === "dna" && (
          <motion.div key="dna" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={t1Name} dataKey="t1" stroke={t1Color} fill={t1Color} fillOpacity={0.18} strokeWidth={2} />
                <Radar name={t2Name} dataKey="t2" stroke={t2Color} fill={t2Color} fillOpacity={0.18} strokeWidth={2} />
                <RTooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any, name: any) => [`${v}`, name]} />
              </RadarChart>
            </ResponsiveContainer>
            {/* Actual value cards */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { label: "Strike Rate", t1v: d1.sr, t2v: d2.sr, suffix: "" },
                { label: "Boundaries", t1v: d1.fours + d1.sixes, t2v: d2.fours + d2.sixes, suffix: "" },
                { label: "Dot Ball%", t1v: d1.dotPct, t2v: d2.dotPct, suffix: "%" },
                { label: "Extras", t1v: d1.extras, t2v: d2.extras, suffix: "" },
              ].map(m => {
                const t1Leads = m.label === "Dot Ball%" ? m.t1v <= m.t2v : m.t1v >= m.t2v;
                return (
                  <div key={m.label} className="bg-black/20 rounded-lg p-2 border border-white/5 flex items-center justify-between">
                    <span className="text-[9px] text-white/35 uppercase tracking-wide">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold tabular-nums ${t1Leads ? "" : "text-white/40"}`} style={t1Leads ? { color: t1Color } : {}}>{m.t1v}{m.suffix}</span>
                      <span className="text-white/20 text-[9px]">|</span>
                      <span className={`text-[11px] font-bold tabular-nums ${!t1Leads ? "" : "text-white/40"}`} style={!t1Leads ? { color: t2Color } : {}}>{m.t2v}{m.suffix}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── TAB 3: Scoring Breakdown ── */}
        {tab === "breakdown" && (
          <motion.div key="breakdown" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <div className="space-y-3">
              {breakdownCats.map(cat => {
                const total = Math.max(cat.t1v + cat.t2v, 1);
                const t1Pct = Math.round((cat.t1v / total) * 100);
                const t2Pct = 100 - t1Pct;
                const t1Leads = cat.label === "Dot balls" ? cat.t1v <= cat.t2v : cat.t1v >= cat.t2v;
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold tabular-nums ${t1Leads ? "" : "text-white/40"}`} style={t1Leads ? { color: t1Color } : {}}>{cat.t1v}</span>
                      <span className="text-[9px] text-white/40 uppercase tracking-wide">{cat.label}</span>
                      <span className={`text-[11px] font-bold tabular-nums ${!t1Leads ? "" : "text-white/40"}`} style={!t1Leads ? { color: t2Color } : {}}>{cat.t2v}</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden gap-px">
                      <motion.div
                        className="rounded-l-full"
                        style={{ backgroundColor: t1Color, opacity: t1Leads ? 1 : 0.45 }}
                        animate={{ width: `${t1Pct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <motion.div
                        className="rounded-r-full"
                        style={{ backgroundColor: t2Color, opacity: !t1Leads ? 1 : 0.45 }}
                        animate={{ width: `${t2Pct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
              {/* Total runs comparison bar */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-black" style={{ color: t1Color }}>{inn1.totalRuns}/{inn1.totalWickets}</span>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">Total Score</span>
                  <span className="text-[13px] font-black" style={{ color: t2Color }}>{inn2.totalRuns}/{inn2.totalWickets}</span>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden gap-px">
                  {(() => {
                    const total = Math.max(inn1.totalRuns + inn2.totalRuns, 1);
                    const p1 = Math.round((inn1.totalRuns / total) * 100);
                    const p2 = 100 - p1;
                    return (
                      <>
                        <motion.div className="rounded-l-full" style={{ backgroundColor: t1Color }} animate={{ width: `${p1}%` }} transition={{ duration: 0.6 }} />
                        <motion.div className="rounded-r-full" style={{ backgroundColor: t2Color }} animate={{ width: `${p2}%` }} transition={{ duration: 0.6 }} />
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Charts ───────────────────────────────────────────────────────────────────
function Charts({ inn1, inn2, matchOvers }: { inn1?: SplInnings; inn2?: SplInnings; matchOvers: number }) {
  if (!inn1) return null;

  // Merge worm data
  const hasInn2Worm = !!(inn2 && inn2.wormData.length > 0);
  const inn1WormName = inn1.battingTeam?.name ?? "Team1";
  const inn2WormName = inn2?.battingTeam?.name ?? "Team2";
  const maxOver = Math.max(
    inn1.wormData.length > 0 ? inn1.wormData[inn1.wormData.length - 1].over : 0,
    hasInn2Worm ? inn2!.wormData[inn2!.wormData.length - 1].over : 0,
  );

  const wormMerged: any[] = [];
  for (let i = 1; i <= maxOver; i++) {
    const entry: any = {
      over: i,
      [inn1WormName]: inn1.wormData.find(d => d.over === i)?.runs ?? null,
    };
    if (hasInn2Worm) {
      entry[inn2WormName] = inn2!.wormData.find(d => d.over === i)?.runs ?? null;
    }
    wormMerged.push(entry);
  }

  const t1Color = inn1.battingTeam?.color ?? "#3b82f6";
  const t2Color = inn2?.battingTeam?.color ?? "#f59e0b";

  // Average run rate line for run rate chart
  const avgRR = inn1.overHistory.length > 0
    ? Math.round(inn1.overHistory.reduce((a, o) => a + o.runs, 0) / inn1.overHistory.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Run Rate Chart — both innings */}
      {(() => {
        const t1Name = inn1.battingTeam?.name ?? "Team 1";
        const t2Name = inn2?.battingTeam?.name ?? "Team 2";
        const hasInn2RR = !!(inn2 && inn2.overHistory.length > 0);
        const maxOv = Math.max(
          inn1.overHistory.length > 0 ? inn1.overHistory[inn1.overHistory.length - 1].over : 0,
          hasInn2RR ? inn2!.overHistory[inn2!.overHistory.length - 1].over : 0,
        );
        if (maxOv === 0) return null;
        const rrMerged: any[] = [];
        for (let i = 1; i <= maxOv; i++) {
          const entry: any = {
            over: i,
            [t1Name]: inn1.overHistory.find((o: any) => o.over === i)?.runs ?? 0,
          };
          if (hasInn2RR) {
            entry[t2Name] = inn2!.overHistory.find((o: any) => o.over === i)?.runs ?? 0;
          }
          rrMerged.push(entry);
        }
        return (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">
              Over-by-Over Run Rate
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1 text-[10px] text-white/50">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: t1Color }} /> {t1Name}
              </span>
              {hasInn2RR && (
                <span className="flex items-center gap-1 text-[10px] text-white/50">
                  <span className="w-3 h-2 rounded-sm inline-block" style={{ background: t2Color }} /> {t2Name}
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={rrMerged} barSize={hasInn2RR ? 10 : 16} barGap={2} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="over" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <RTooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  formatter={(v: any, name: any) => [`${v} runs`, name]}
                />
                <Bar dataKey={t1Name} fill={t1Color} radius={[3, 3, 0, 0]} />
                {hasInn2RR && <Bar dataKey={t2Name} fill={t2Color} radius={[3, 3, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* Worm Chart */}
      {maxOver > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">Run Progression (Worm)</p>
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1 text-[10px] text-white/50">
              <span className="w-5 h-0.5 rounded inline-block" style={{ background: t1Color }} /> {inn1WormName}
            </span>
            {hasInn2Worm && (
              <span className="flex items-center gap-1 text-[10px] text-white/50">
                <span className="w-5 h-0.5 rounded inline-block" style={{ background: t2Color }} /> {inn2WormName}
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={wormMerged}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="over" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <RTooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any, name: any) => [`${v} runs`, name]} />
              <Line type="monotone" dataKey={inn1WormName} stroke={t1Color} dot={false} strokeWidth={2} connectNulls />
              {hasInn2Worm && <Line type="monotone" dataKey={inn2WormName} stroke={t2Color} dot={false} strokeWidth={2} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Team Comparison Panel ── */}
      {inn2 && <TeamComparison inn1={inn1} inn2={inn2} matchOvers={matchOvers} />}

      {/* Win Probability Chart — both teams */}
      {inn2 && inn2.winProbHistory.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">
            Win Probability
          </p>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-bold" style={{ color: t2Color }}>{inn2.battingTeam?.name}</span>
                <span className="font-bold text-white text-sm">{inn2.winProb ?? 50}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: t2Color }}
                  animate={{ width: `${inn2.winProb ?? 50}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
            <div className="text-[11px] text-white/30">vs</div>
            <div className="text-right text-[11px]">
              <div className="font-bold" style={{ color: t1Color }}>{inn1.battingTeam?.name}</div>
              <div className="font-bold text-white">{100 - (inn2.winProb ?? 50)}%</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={inn2.winProbHistory.map((d: any) => ({ ...d, prob2: 100 - d.prob }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="over" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={28}
                tickFormatter={(v) => `${v}%`} />
              <RTooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any, name: any) => [`${v}%`, name === "prob" ? (inn2.battingTeam?.name ?? "Team 2") : (inn1.battingTeam?.name ?? "Team 1")]} />
              <Legend
                formatter={(value) => value === "prob" ? inn2.battingTeam?.name ?? "Team 2" : inn1.battingTeam?.name ?? "Team 1"}
                wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}
              />
              <ReferenceLine y={50} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="prob" stroke={(inn2.winProb ?? 50) >= 50 ? "#22c55e" : "#ef4444"} dot={false} strokeWidth={2.5} name="prob" />
              <Line type="monotone" dataKey="prob2" stroke={(inn2.winProb ?? 50) < 50 ? "#22c55e" : "#ef4444"} dot={false} strokeWidth={2.5} name="prob2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── ScoringPanel (Admin Only) ─────────────────────────────────────────────────
interface ScoringPanelProps {
  scorecard: any;
  matchId: string;
  startInnings: (body: any) => Promise<void>;
  addBall: (inningsId: string, body: any) => Promise<any>;
  undoBall: (inningsId: string) => Promise<void>;
  completeInnings: (inningsId: string) => Promise<void>;
  updateMatch: (body: any) => Promise<void>;
  updateLineup: (inningsId: string, body: any) => Promise<void>;
}

function ScoringPanel({ scorecard, matchId, startInnings, addBall, undoBall, completeInnings, updateMatch, updateLineup }: ScoringPanelProps) {
  const { players, teams } = useData();

  const match = scorecard?.match;
  const inn1 = scorecard?.innings?.find((i: any) => i.inningsNumber === 1);
  const inn2 = scorecard?.innings?.find((i: any) => i.inningsNumber === 2);
  const activeInnings: SplInnings | undefined = scorecard?.innings?.find((i: any) => i.status === "in_progress");

  const storageKey = `spl-scoring-${matchId}`;
  const [strikerId, setStrikerId] = useState(() => localStorage.getItem(`${storageKey}-striker`) ?? "");
  const [nonStrikerId, setNonStrikerId] = useState(() => localStorage.getItem(`${storageKey}-nonstriker`) ?? "");
  const [bowlerId, setBowlerId] = useState(() => localStorage.getItem(`${storageKey}-bowler`) ?? "");

  useEffect(() => { localStorage.setItem(`${storageKey}-striker`, strikerId); }, [storageKey, strikerId]);
  useEffect(() => { localStorage.setItem(`${storageKey}-nonstriker`, nonStrikerId); }, [storageKey, nonStrikerId]);
  useEffect(() => { localStorage.setItem(`${storageKey}-bowler`, bowlerId); }, [storageKey, bowlerId]);

  // ── Sync lineup: DB ↔ localStorage on innings load ──────────────────────────
  // DB values are source of truth; if DB is empty but localStorage has values, push them to DB
  const lineupSyncedInningsRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeInnings || lineupSyncedInningsRef.current === activeInnings.id) return;
    lineupSyncedInningsRef.current = activeInnings.id;

    const dbS = activeInnings.currentStrikerId ?? "";
    const dbNs = activeInnings.currentNonStrikerId ?? "";
    const dbB = activeInnings.currentBowlerId ?? "";

    // DB has values → load them into local state (DB wins)
    if (dbS) setStrikerId(dbS);
    if (dbNs) setNonStrikerId(dbNs);
    if (dbB) setBowlerId(dbB);

    // DB is empty but localStorage has values → push localStorage to DB immediately
    if (!dbS || !dbNs || !dbB) {
      const lsS = !dbS ? (localStorage.getItem(`${storageKey}-striker`) ?? "") : "";
      const lsNs = !dbNs ? (localStorage.getItem(`${storageKey}-nonstriker`) ?? "") : "";
      const lsB = !dbB ? (localStorage.getItem(`${storageKey}-bowler`) ?? "") : "";
      const body: Record<string, string> = {};
      if (lsS) body.strikerId = lsS;
      if (lsNs) body.nonStrikerId = lsNs;
      if (lsB) body.bowlerId = lsB;
      if (Object.keys(body).length > 0) updateLineup(activeInnings.id, body);
    }
  }, [activeInnings?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pendingBallType, setPendingBallType] = useState<string | null>(null);

  // Wicket modal
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState("bowled");
  const [fielderId, setFielderId] = useState("");

  // New batsman modal
  const [showNewBatsman, setShowNewBatsman] = useState(false);
  const [newBatsmanId, setNewBatsmanId] = useState("");

  // New bowler (end of over)
  const [showNewBowler, setShowNewBowler] = useState(false);
  const [newBowlerId, setNewBowlerId] = useState("");

  // No Ball modal
  const [showNoBallModal, setShowNoBallModal] = useState(false);
  const [noBallRuns, setNoBallRuns] = useState(0);

  // Start innings state
  const [battingTeamId, setBattingTeamId] = useState("");
  const [bowlingTeamId, setBowlingTeamId] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [tossWinner, setTossWinner] = useState("");
  const [tossDecision, setTossDecision] = useState("bat");

  const [ytUrl, setYtUrl] = useState(match?.youtubeUrl ?? "");
  useEffect(() => { setYtUrl(match?.youtubeUrl ?? ""); }, [match?.youtubeUrl]);

  const bothTeams = [
    teams.find(t => t.id === match?.team1Id),
    teams.find(t => t.id === match?.team2Id),
  ].filter(Boolean);

  const battingPlayers = activeInnings ? players.filter(p => p.teamId === activeInnings.battingTeamId) : [];
  const bowlingPlayers = activeInnings ? players.filter(p => p.teamId === activeInnings.bowlingTeamId) : [];
  const outIds = new Set((activeInnings?.batsmenStats ?? []).filter((s: any) => s.isOut).map((s: any) => s.playerId));
  const availableBatsmen = battingPlayers.filter(p => !outIds.has(p.id) && p.id !== strikerId && p.id !== nonStrikerId);
  const fielderOptions = bowlingPlayers;

  const handleBall = useCallback(async (runsOffBat: number, extras: number = 0, extrasType: string = "none") => {
    if (!activeInnings || !strikerId || !bowlerId) {
      toast.error("Select striker and bowler first"); return;
    }
    const prevStriker = strikerId;
    const prevNonStriker = nonStrikerId;
    const prevOvers = activeInnings.oversCompleted;

    try {
      const result = await addBall(activeInnings.id, {
        batsmanId: strikerId, bowlerId,
        runsOffBat, extras, extrasType,
        isWicket: false, wicketType: null, fielderId: null,
      });

      const inn = result?.innings;
      const totalRuns = runsOffBat + extras;

      // rotate strike on odd runs off bat (not wide/noball)
      const rotateOnRun = extrasType !== "wide" && extrasType !== "noball" && totalRuns % 2 === 1;
      if (rotateOnRun) {
        setStrikerId(prevNonStriker);
        setNonStrikerId(prevStriker);
        if (activeInnings) updateLineup(activeInnings.id, { strikerId: prevNonStriker, nonStrikerId: prevStriker });
      }

      // end of over
      if (inn && inn.ballsCurrentOver === 0 && inn.oversCompleted > prevOvers) {
        // Rotate strike at end of over only if even runs (odd already rotated above)
        if (totalRuns % 2 === 0) {
          setStrikerId(prevNonStriker);
          setNonStrikerId(prevStriker);
          if (activeInnings) updateLineup(activeInnings.id, { strikerId: prevNonStriker, nonStrikerId: prevStriker });
        }
        setShowNewBowler(true);
      }

      if (result?.autoCompleted) {
        toast.success("Innings completed automatically!");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  }, [activeInnings, strikerId, nonStrikerId, bowlerId, addBall]);

  const handleWicket = useCallback(async () => {
    if (!activeInnings || !strikerId || !bowlerId) {
      toast.error("Select striker and bowler first"); return;
    }
    const prevStriker = strikerId;
    const prevOvers = activeInnings.oversCompleted;

    try {
      const result = await addBall(activeInnings.id, {
        batsmanId: strikerId, bowlerId,
        runsOffBat: 0, extras: 0, extrasType: "none",
        isWicket: true, wicketType, fielderId: fielderId || null,
      });

      setShowWicketModal(false);
      setWicketType("bowled");
      setFielderId("");
      setStrikerId(""); // batter is out
      // Push cleared striker to DB immediately so user side removes the dismissed batter
      if (activeInnings) updateLineup(activeInnings.id, { strikerId: null });

      const inn = result?.innings;
      if (result?.autoCompleted) {
        toast.success("All out! Innings completed.");
      } else {
        if (inn && inn.ballsCurrentOver === 0 && inn.oversCompleted > prevOvers) {
          setShowNewBowler(true);
        } else {
          setShowNewBatsman(true);
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  }, [activeInnings, strikerId, bowlerId, wicketType, fielderId, addBall]);

  const handleUndo = async () => {
    if (!activeInnings) return;
    try {
      await undoBall(activeInnings.id);
      toast.success("Last ball undone");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStartInnings = async (num: number) => {
    if (!battingTeamId || !bowlingTeamId) { toast.error("Select both teams"); return; }
    try {
      await startInnings({ battingTeamId, bowlingTeamId, inningsNumber: num });
      setBattingTeamId(""); setBowlingTeamId("");
      toast.success(`Innings ${num} started!`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCompleteMatch = async () => {
    if (!winnerId) { toast.error("Select winner"); return; }
    try {
      await updateMatch({ status: "completed", winnerId });
      toast.success("Match completed!");
    } catch (e: any) { toast.error(e.message); }
  };

  const currentOverBalls = activeInnings?.currentOverBalls ?? [];

  // ── No innings yet ──
  if (!inn1 && match?.status !== "completed") {
    return (
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="font-heading text-base text-white uppercase tracking-wide">Start 1st Innings</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Batting Team</label>
              <Select value={battingTeamId} onValueChange={setBattingTeamId}>
                <SelectTrigger className="bg-black/30 border-white/10 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{bothTeams.map(t => t && <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Bowling Team</label>
              <Select value={bowlingTeamId} onValueChange={setBowlingTeamId}>
                <SelectTrigger className="bg-black/30 border-white/10 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{bothTeams.map(t => t && <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full bg-primary font-bold" onClick={() => handleStartInnings(1)}>
            🏏 Begin 1st Innings
          </Button>
        </div>
      </div>
    );
  }

  // ── 1st innings done, 2nd not started ──
  if (inn1?.status === "completed" && !inn2 && match?.status !== "completed") {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
          <p className="font-heading text-lg text-emerald-400 uppercase">1st Innings Complete</p>
          <p className="text-white/60 text-sm mt-1">{inn1.battingTeam?.name} scored {inn1.totalRuns}/{inn1.totalWickets}</p>
          <p className="text-white font-bold text-xl mt-2">{inn1.battingTeam?.color && "Target: "}<span className="text-primary">{inn1.totalRuns + 1}</span> runs</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="font-heading text-base text-white uppercase tracking-wide">Start 2nd Innings</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Batting Team</label>
              <Select value={battingTeamId} onValueChange={setBattingTeamId}>
                <SelectTrigger className="bg-black/30 border-white/10 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{bothTeams.map(t => t && <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Bowling Team</label>
              <Select value={bowlingTeamId} onValueChange={setBowlingTeamId}>
                <SelectTrigger className="bg-black/30 border-white/10 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{bothTeams.map(t => t && <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full bg-primary font-bold" onClick={() => handleStartInnings(2)}>
            🏏 Begin 2nd Innings
          </Button>
        </div>
      </div>
    );
  }

  // ── Both innings done or match complete → mark winner ──
  if ((inn1?.status === "completed" && inn2?.status === "completed") || match?.status === "completed") {
    if (match?.status === "completed") {
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="font-heading text-xl text-yellow-400 uppercase">Match Complete</p>
          <p className="text-white/60 mt-1">Winner: <span className="text-white font-bold">{match.winner?.name ?? "—"}</span></p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="font-heading text-base text-white uppercase">Complete Match</h3>
          <Select value={winnerId} onValueChange={setWinnerId}>
            <SelectTrigger className="bg-black/30 border-white/10 h-9 text-sm"><SelectValue placeholder="Select winner..." /></SelectTrigger>
            <SelectContent>{bothTeams.map(t => t && <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-400" onClick={handleCompleteMatch}>
            🏆 Mark Match Complete
          </Button>
        </div>
      </div>
    );
  }

  // ── Active innings scoring panel ──
  if (!activeInnings) return null;
  const needsSetup = !strikerId || !nonStrikerId || !bowlerId;

  return (
    <div className="space-y-4">
      {/* YouTube Stream Management */}
      <div className="bg-black/20 border border-red-500/20 rounded-xl p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 flex items-center gap-1.5">
          <Youtube className="w-3.5 h-3.5" /> Live Stream
        </p>
        <div className="flex gap-2">
          <Input
            value={ytUrl}
            onChange={e => setYtUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="bg-black/40 border-white/10 h-8 text-xs flex-1"
          />
          <Button size="sm"
            className="h-8 text-[11px] bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 px-3"
            onClick={async () => {
              try { await updateMatch({ youtubeUrl: ytUrl || null }); toast.success(ytUrl ? "Stream link saved!" : "Stream removed"); }
              catch (e: any) { toast.error(e.message); }
            }}>
            {ytUrl ? "Save" : "Clear"}
          </Button>
        </div>
        {match?.youtubeUrl && (
          <p className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Stream is live on public view
          </p>
        )}
      </div>

      {/* Setup: select batsmen + bowler */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40">
          Current Players · Over {fmtOvers(activeInnings.oversCompleted, activeInnings.ballsCurrentOver)}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-white/40 uppercase tracking-wider mb-1 block">⭐ Striker</label>
            <Select value={strikerId} onValueChange={(v) => { setStrikerId(v); if (activeInnings) updateLineup(activeInnings.id, { strikerId: v }); }}>
              <SelectTrigger className="bg-black/30 border-white/10 h-8 text-xs"><SelectValue placeholder="On strike" /></SelectTrigger>
              <SelectContent className="max-h-52 overflow-y-auto">{battingPlayers.filter(p => !outIds.has(p.id) && p.id !== nonStrikerId).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[9px] text-white/40 uppercase tracking-wider mb-1 block">Non-Striker</label>
            <Select value={nonStrikerId} onValueChange={(v) => { setNonStrikerId(v); if (activeInnings) updateLineup(activeInnings.id, { nonStrikerId: v }); }}>
              <SelectTrigger className="bg-black/30 border-white/10 h-8 text-xs"><SelectValue placeholder="Non-striker" /></SelectTrigger>
              <SelectContent className="max-h-52 overflow-y-auto">{battingPlayers.filter(p => !outIds.has(p.id) && p.id !== strikerId).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[9px] text-white/40 uppercase tracking-wider mb-1 block">Bowler</label>
            <Select value={bowlerId} onValueChange={(v) => { setBowlerId(v); if (activeInnings) updateLineup(activeInnings.id, { bowlerId: v }); }}>
              <SelectTrigger className="bg-black/30 border-white/10 h-8 text-xs"><SelectValue placeholder="Bowler" /></SelectTrigger>
              <SelectContent className="max-h-52 overflow-y-auto">{bowlingPlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {strikerId && nonStrikerId && (
          <button
            onClick={() => {
              const t = strikerId;
              setStrikerId(nonStrikerId);
              setNonStrikerId(t);
              if (activeInnings) updateLineup(activeInnings.id, { strikerId: nonStrikerId, nonStrikerId: strikerId });
            }}
            className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Rotate Strike
          </button>
        )}
      </div>

      {/* Current over balls */}
      {currentOverBalls.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2">This Over</p>
          <div className="flex gap-2 flex-wrap">
            {currentOverBalls.map((b) => <BallDot key={b.id} ball={b} />)}
          </div>
        </div>
      )}

      {/* Ball entry buttons */}
      <div className={`bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 ${needsSetup ? "opacity-50 pointer-events-none" : ""}`}>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Ball Entry</p>
        {/* Runs */}
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(r => (
            <button key={r} onClick={() => handleBall(r)}
              className="h-14 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 font-heading text-2xl text-white transition-all">
              {r === 0 ? "·" : r}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => handleBall(4)}
            className="h-14 rounded-xl bg-blue-500/30 hover:bg-blue-500/50 active:scale-95 font-heading text-2xl text-blue-300 border border-blue-500/30 transition-all">4</button>
          <button onClick={() => handleBall(6)}
            className="h-14 rounded-xl bg-purple-500/30 hover:bg-purple-500/50 active:scale-95 font-heading text-2xl text-purple-300 border border-purple-500/30 transition-all">6</button>
          <button onClick={() => setShowWicketModal(true)}
            className="h-14 rounded-xl bg-red-500/30 hover:bg-red-500/50 active:scale-95 font-heading text-2xl text-red-300 border border-red-500/30 transition-all">W</button>
        </div>
        {/* Extras */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Wide", type: "wide", extras: 1 },
            { label: "Bye", type: "bye", extras: 1 },
            { label: "Leg Bye", type: "legbye", extras: 1 },
          ].map(({ label, type, extras }) => (
            <button key={type} onClick={() => handleBall(0, extras, type)}
              className="h-10 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 active:scale-95 text-[11px] font-bold text-yellow-400 border border-yellow-500/20 transition-all">
              {label}
            </button>
          ))}
          <button onClick={() => { setNoBallRuns(0); setShowNoBallModal(true); }}
            className="h-10 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 active:scale-95 text-[11px] font-bold text-orange-400 border border-orange-500/20 transition-all">
            No Ball
          </button>
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleUndo}
            className="flex-1 h-10 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-white/60 border border-white/10 flex items-center justify-center gap-1.5 transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> Undo Last Ball
          </button>
          <button onClick={async () => { await completeInnings(activeInnings.id); toast.success("Innings completed!"); }}
            className="flex-1 h-10 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 text-xs font-bold text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-all">
            <CheckCircle2 className="w-3.5 h-3.5" /> End Innings
          </button>
        </div>
      </div>

      {/* Wicket Modal */}
      <AnimatePresence>
        {showWicketModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-heading text-lg text-red-400 uppercase">Wicket</h3>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-2 block">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["bowled", "caught", "lbw", "runout", "stumped", "hitwicket"].map(t => (
                    <button key={t} onClick={() => setWicketType(t)}
                      className={`py-2 rounded-lg text-[11px] font-bold capitalize transition-all ${wicketType === t ? "bg-red-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {(wicketType === "caught" || wicketType === "stumped" || wicketType === "runout") && (
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Fielder</label>
                  <Select value={fielderId} onValueChange={setFielderId}>
                    <SelectTrigger className="bg-black/30 border-white/10 h-9 text-sm"><SelectValue placeholder="Select fielder" /></SelectTrigger>
                    <SelectContent>{fielderOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-white/10 text-white/60" onClick={() => setShowWicketModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={handleWicket}>Confirm Out</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Ball Modal */}
      <AnimatePresence>
        {showNoBallModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-heading text-lg text-orange-400 uppercase">No Ball — Runs off Bat</h3>
              <p className="text-[11px] text-white/40">Select runs scored by the batsman on this no ball (1 extra will be added automatically)</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(r => (
                  <button key={r} onClick={() => setNoBallRuns(r)}
                    className={`h-12 rounded-xl font-heading text-xl transition-all active:scale-95 ${noBallRuns === r
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                    {r === 0 ? "·" : r}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-white/10 text-white/60"
                  onClick={() => setShowNoBallModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={async () => {
                  setShowNoBallModal(false);
                  await handleBall(noBallRuns, 1, "noball");
                }}>
                  Confirm — {noBallRuns} + 1 Nb
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Batsman Modal */}
      <AnimatePresence>
        {showNewBatsman && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-heading text-lg text-white uppercase">New Batsman</h3>
              <Select value={newBatsmanId} onValueChange={setNewBatsmanId}>
                <SelectTrigger className="bg-black/30 border-white/10 h-9 text-sm"><SelectValue placeholder="Select new batsman" /></SelectTrigger>
                <SelectContent>
                  {battingPlayers.filter(p => !outIds.has(p.id) && p.id !== nonStrikerId)
                    .map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full bg-primary" onClick={() => {
                if (newBatsmanId) {
                  setStrikerId(newBatsmanId);
                  // Push new striker to DB immediately → user side sees instantly
                  if (activeInnings) updateLineup(activeInnings.id, { strikerId: newBatsmanId });
                  setNewBatsmanId("");
                  setShowNewBatsman(false);
                } else toast.error("Select a batsman");
              }}>Send to Crease</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Bowler Modal */}
      <AnimatePresence>
        {showNewBowler && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-heading text-lg text-white uppercase">New Bowler — Over {activeInnings.oversCompleted + 1}</h3>
              <Select value={newBowlerId} onValueChange={setNewBowlerId}>
                <SelectTrigger className="bg-black/30 border-white/10 h-9 text-sm"><SelectValue placeholder="Select bowler" /></SelectTrigger>
                <SelectContent>{bowlingPlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button className="w-full bg-primary" onClick={() => {
                if (newBowlerId) {
                  setBowlerId(newBowlerId);
                  // Push new bowler to DB immediately → user side sees instantly
                  if (activeInnings) updateLineup(activeInnings.id, { bowlerId: newBowlerId });
                  setNewBowlerId("");
                  setShowNewBowler(false);
                } else toast.error("Select a bowler");
              }}>Set Bowler</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Performance Highlights ────────────────────────────────────────────────────
function PerformanceHighlights({ inn1, inn2, t1, t2 }: { inn1?: SplInnings; inn2?: SplInnings; t1?: any; t2?: any }) {
  if (!inn1 && !inn2) return null;

  // Each team's batting & bowling innings
  const t1BatInn = [inn1, inn2].find(i => i && i.battingTeamId === t1?.id);
  const t2BatInn = [inn1, inn2].find(i => i && i.battingTeamId === t2?.id);
  const t1BowlInn = [inn1, inn2].find(i => i && i.bowlingTeamId === t1?.id);
  const t2BowlInn = [inn1, inn2].find(i => i && i.bowlingTeamId === t2?.id);

  // Top scorer
  const topScorer = (inn?: SplInnings): BatsmanStat | null =>
    inn?.batsmenStats.reduce((best: BatsmanStat | null, s) => !best || s.runs > best.runs ? s : best, null) ?? null;

  // Best bowler — most wickets, tie → best economy
  const bestBowler = (inn?: SplInnings): BowlerStat | null =>
    inn?.bowlerStats.filter(s => s.balls > 0).reduce((best: BowlerStat | null, s) => {
      if (!best) return s;
      if (s.wickets > best.wickets) return s;
      if (s.wickets === best.wickets && s.economy < best.economy) return s;
      return best;
    }, null) ?? null;

  // Best fielder — count from batsmenStats.fielder
  const bestFielder = (inn?: SplInnings): { name: string; count: number } | null => {
    if (!inn) return null;
    const counts: Record<string, { name: string; count: number }> = {};
    for (const stat of inn.batsmenStats) {
      if (stat.isOut && stat.fielder) {
        const key = stat.fielder.name;
        if (!counts[key]) counts[key] = { name: stat.fielder.name, count: 0 };
        counts[key].count++;
      }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count)[0] ?? null;
  };

  // Man of the Match — combined impact score
  type Candidate = { name: string; score: number; label: string };
  const allBat: Candidate[] = [...(inn1?.batsmenStats ?? []), ...(inn2?.batsmenStats ?? [])].map(s => ({
    name: s.player?.name ?? "?",
    score: s.runs + (s.sr > 150 ? 15 : 0) + s.fours * 0.5 + s.sixes,
    label: `${s.runs} runs (SR ${s.sr?.toFixed(0)})`,
  }));
  const allBowl: Candidate[] = [...(inn1?.bowlerStats ?? []), ...(inn2?.bowlerStats ?? [])].filter(s => s.balls > 0).map(s => ({
    name: s.player?.name ?? "?",
    score: s.wickets * 25 + Math.max(0, 10 - s.economy),
    label: `${s.wickets}W · Eco ${s.economy?.toFixed(1)}`,
  }));
  const mom = [...allBat, ...allBowl].sort((a, b) => b.score - a.score)[0] ?? null;

  const t1Top = topScorer(t1BatInn);
  const t2Top = topScorer(t2BatInn);
  const t1Bowl = bestBowler(t1BowlInn);
  const t2Bowl = bestBowler(t2BowlInn);
  const t1Field = bestFielder(t1BowlInn);
  const t2Field = bestFielder(t2BowlInn);

  const StatRow = ({ icon, label, name, detail }: { icon: string; label: string; name?: string | null; detail?: string }) => (
    <div className="flex items-center gap-2.5 bg-black/25 rounded-xl p-2.5">
      <span className="text-base w-6 text-center flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold leading-none mb-0.5">{label}</p>
        <p className="text-sm font-heading text-white leading-tight truncate">{name ?? "—"}</p>
        {detail && <p className="text-[10px] text-white/40 leading-tight">{detail}</p>}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <h3 className="font-heading text-xs uppercase tracking-widest text-white/40">Performance Highlights</h3>
      </div>

      {/* Two-team grid */}
      <div className="grid grid-cols-2 gap-3 p-4 pt-3">
        {/* Team 1 */}
        <div className="space-y-2">
          <p className="font-heading text-[10px] uppercase tracking-widest truncate pb-1 text-white/50">
            {t1?.name}
          </p>
          <StatRow icon="🏏" label="Top Scorer" name={t1Top?.player?.name} detail={t1Top ? `${t1Top.runs} runs (${t1Top.balls}b) · SR ${t1Top.sr?.toFixed(1)}` : undefined} />
          <StatRow icon="🎳" label="Best Bowler" name={t1Bowl?.player?.name} detail={t1Bowl ? `${t1Bowl.wickets}W · Eco ${t1Bowl.economy?.toFixed(1)}` : undefined} />
          <StatRow icon="🧤" label="Best Fielder" name={t1Field?.name} detail={t1Field ? `${t1Field.count} dismissal${t1Field.count !== 1 ? "s" : ""}` : undefined} />
        </div>

        {/* Team 2 */}
        <div className="space-y-2">
          <p className="font-heading text-[10px] uppercase tracking-widest truncate pb-1 text-white/50">
            {t2?.name}
          </p>
          <StatRow icon="🏏" label="Top Scorer" name={t2Top?.player?.name} detail={t2Top ? `${t2Top.runs} runs (${t2Top.balls}b) · SR ${t2Top.sr?.toFixed(1)}` : undefined} />
          <StatRow icon="🎳" label="Best Bowler" name={t2Bowl?.player?.name} detail={t2Bowl ? `${t2Bowl.wickets}W · Eco ${t2Bowl.economy?.toFixed(1)}` : undefined} />
          <StatRow icon="🧤" label="Best Fielder" name={t2Field?.name} detail={t2Field ? `${t2Field.count} dismissal${t2Field.count !== 1 ? "s" : ""}` : undefined} />
        </div>
      </div>
    </div>
  );
}

// ── Main MatchDetail Page ─────────────────────────────────────────────────────
export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { scorecard, loading, startInnings, addBall, undoBall, completeInnings, updateMatch, updateLineup } = useScorecard(id, 2000);
  const { players: allPlayers } = useData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"scorecard" | "scoring">("scorecard");

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("splAdmin") === "1");
  }, []);

  const match = scorecard?.match;
  const inn1 = scorecard?.innings?.find((i: SplInnings) => i.inningsNumber === 1);
  const inn2 = scorecard?.innings?.find((i: SplInnings) => i.inningsNumber === 2);
  const activeInnings: SplInnings | undefined = scorecard?.innings?.find((i: SplInnings) => i.status === "in_progress");

  // ── Ticker data: stable entry-order batsmen + strikerId from DB ──
  const hasBalls = (activeInnings?.balls?.length ?? 0) > 0;
  const notOutStats = activeInnings?.batsmenStats.filter(s => !s.isOut) ?? [];

  // strikerId: prefer DB value; fall back to last ball's batsman
  const dbStrikerId = activeInnings?.currentStrikerId ?? null;
  const lastBallStrikerId = hasBalls
    ? activeInnings!.balls[activeInnings!.balls.length - 1].batsmanId
    : null;
  const tickerStrikerId = dbStrikerId ?? lastBallStrikerId;

  // bat1 / bat2 in STABLE entry order (no sorting by strike — only red dot moves)
  let tickerBat1: any = null;
  let tickerBat2: any = null;

  const makeSyntheticBat = (pid: string) => {
    const p = allPlayers.find((pl: any) => pl.id === pid);
    return p ? { player: p, runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, isOut: false, playerId: pid } : null;
  };

  if (hasBalls && notOutStats.length > 0) {
    tickerBat1 = notOutStats[0];
    if (notOutStats.length >= 2) {
      tickerBat2 = notOutStats[1];
    } else {
      // Only 1 batsman has hit balls yet; find the other from DB lineup
      const facedId = notOutStats[0].playerId;
      const dbIds = [activeInnings?.currentStrikerId, activeInnings?.currentNonStrikerId].filter(Boolean);
      const otherId = dbIds.find(pid => pid !== facedId) ?? null;
      tickerBat2 = otherId ? makeSyntheticBat(otherId) : null;
    }
  } else if (!hasBalls && activeInnings?.currentStrikerId) {
    // No balls yet — build both from DB lineup
    tickerBat1 = makeSyntheticBat(activeInnings.currentStrikerId);
    tickerBat2 = activeInnings.currentNonStrikerId ? makeSyntheticBat(activeInnings.currentNonStrikerId) : null;
  }

  // lastOutName: when exactly 1 not-out left (wicket fell, new player not yet in)
  const lastOutName: string | null = (hasBalls && notOutStats.length < 2)
    ? (activeInnings!.batsmenStats.filter(s => s.isOut).slice(-1)[0]?.player?.name ?? null)
    : null;

  // currentBowler: from bowl stats or DB bowlerId
  const dbBowlerId = activeInnings?.currentBowlerId ?? null;
  const lastBallBowlerId = hasBalls
    ? activeInnings!.balls[activeInnings!.balls.length - 1].bowlerId
    : null;
  const activeBowlerId = dbBowlerId ?? lastBallBowlerId;
  const currentBowler = activeInnings && activeBowlerId
    ? (activeInnings.bowlerStats.find(s => s.playerId === activeBowlerId) ?? null)
    : null;

  // Bowler name override when no ball data yet
  const bowlerNameOverride: string | null =
    (!hasBalls && activeInnings?.currentBowlerId)
      ? (allPlayers.find((p: any) => p.id === activeInnings.currentBowlerId)?.name ?? null)
      : null;

  // Show ticker when we have at least bat1
  const showTicker = !!activeInnings && !!tickerBat1;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm uppercase tracking-wider">Loading Match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40">Match not found</p>
          <Link href="/" className="text-primary mt-4 block hover:underline">← Back</Link>
        </div>
      </div>
    );
  }

  const t1 = match.team1;
  const t2 = match.team2;

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-5 pb-12">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider mb-5">
          <ArrowLeft className="w-4 h-4" /> All Matches
        </Link>

        {/* Match Header */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-4">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${t1?.color ?? "#3b82f6"}, ${t2?.color ?? "#f59e0b"})` }} />
          <div className="relative z-10 p-5">
            {/* Status */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {match.venue || "SPL Match"} · {match.overs} Overs
              </span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                match.status === "ongoing" ? "bg-red-500/20 border-red-500/30 text-red-400" :
                match.status === "completed" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
              }`}>
                {match.status === "ongoing" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                {match.status}
              </span>
            </div>

            {/* Teams + Score */}
            <div className="flex items-center gap-4">
              {/* Team 1 */}
              <div className="flex-1 text-center">
                <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ background: `${t1?.color ?? "#3b82f6"}20`, border: `1px solid ${t1?.color ?? "#3b82f6"}40` }}>
                  {t1?.logo ? <img src={t1.logo} alt="" className="w-10 h-10 object-contain" /> : <span className="font-heading text-lg text-white/40">{t1?.name?.substring(0, 2)}</span>}
                </div>
                <p className="font-heading text-sm text-white uppercase tracking-wide truncate">{t1?.name}</p>
                {inn1 && inn1.battingTeamId === t1?.id && (
                  <p className="font-heading text-2xl text-white mt-1">{inn1.totalRuns}/{inn1.totalWickets}</p>
                )}
                {inn2 && inn2.battingTeamId === t1?.id && (
                  <p className="font-heading text-2xl text-white mt-1">{inn2.totalRuns}/{inn2.totalWickets}</p>
                )}
                {inn1 && inn1.battingTeamId !== t1?.id && inn2 && inn2.battingTeamId !== t1?.id && (
                  <p className="text-white/30 text-sm mt-1">—</p>
                )}
                {inn1 && inn1.battingTeamId !== t1?.id && !inn2 && (
                  <p className="text-white/30 text-sm mt-1">{inn1.totalRuns}/{inn1.totalWickets}</p>
                )}
              </div>

              {/* VS */}
              <div className="text-center flex-shrink-0">
                <span className="font-heading text-2xl text-white/20">vs</span>
                {activeInnings && (
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mt-1">
                    {fmtOvers(activeInnings.oversCompleted, activeInnings.ballsCurrentOver)} ov
                  </p>
                )}
              </div>

              {/* Team 2 */}
              <div className="flex-1 text-center">
                <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ background: `${t2?.color ?? "#f59e0b"}20`, border: `1px solid ${t2?.color ?? "#f59e0b"}40` }}>
                  {t2?.logo ? <img src={t2.logo} alt="" className="w-10 h-10 object-contain" /> : <span className="font-heading text-lg text-white/40">{t2?.name?.substring(0, 2)}</span>}
                </div>
                <p className="font-heading text-sm text-white uppercase tracking-wide truncate">{t2?.name}</p>
                {inn1 && inn1.battingTeamId === t2?.id && (
                  <p className="font-heading text-2xl text-white mt-1">{inn1.totalRuns}/{inn1.totalWickets}</p>
                )}
                {inn2 && inn2.battingTeamId === t2?.id && (
                  <p className="font-heading text-2xl text-white mt-1">{inn2.totalRuns}/{inn2.totalWickets}</p>
                )}
                {!inn1 && !inn2 && <p className="text-white/30 text-sm mt-1">—</p>}
              </div>
            </div>

            {/* Winner banner */}
            {match.status === "completed" && match.winner && (
              <div className="mt-4 flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2.5 px-4">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="font-heading text-sm text-yellow-400 uppercase tracking-wider">
                  {match.winner.name} won!
                </span>
              </div>
            )}

            {/* 2nd innings target / status */}
            {activeInnings?.inningsNumber === 2 && activeInnings.target && (
              <div className="mt-3 bg-black/30 rounded-xl px-4 py-2.5 text-center">
                <span className="text-sm text-white/60">Target: <span className="font-bold text-white">{activeInnings.target}</span></span>
                <span className="mx-3 text-white/20">·</span>
                <span className="text-sm text-white/60">Need: <span className="font-bold text-primary">{Math.max(0, activeInnings.target - activeInnings.totalRuns)}</span> in <span className="font-bold text-primary">{(match.overs * 6) - (activeInnings.oversCompleted * 6 + activeInnings.ballsCurrentOver)}</span> balls</span>
                {activeInnings.winProb !== null && (
                  <>
                    <span className="mx-3 text-white/20">·</span>
                    <span className="text-sm text-white/60">Win%: <span className="font-bold" style={{ color: t2?.color }}>{activeInnings.winProb}%</span></span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Score Ticker */}
        {showTicker && (
          <LiveScoreTicker
            activeInnings={activeInnings!}
            bat1={tickerBat1}
            bat2={tickerBat2}
            strikerId={tickerStrikerId}
            lastOutName={lastOutName}
            currentBowler={currentBowler}
            bowlerNameOverride={bowlerNameOverride}
          />
        )}

        {/* YouTube Live Stream Card */}
        {match.youtubeUrl && (
          <YouTubeCard url={match.youtubeUrl} />
        )}

        {/* Tabs (only if match has started) */}
        {(match.status === "ongoing" || match.status === "completed") && (
          <>
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 mb-4">
              <button
                onClick={() => setTab("scorecard")}
                className={`flex-1 font-heading text-sm tracking-wide py-2 rounded-md transition-all ${tab === "scorecard" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Scorecard
              </button>
              {isAdmin && (
                <button
                  onClick={() => setTab("scoring")}
                  className={`flex-1 font-heading text-sm tracking-wide py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${tab === "scoring" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  <Zap className="w-3.5 h-3.5" /> Live Scoring
                </button>
              )}
            </div>

            {tab === "scorecard" && (
              <div className="space-y-6">
                {/* Charts */}
                {(inn1 || inn2) && <Charts inn1={inn1} inn2={inn2} matchOvers={match.overs} />}
                {/* Innings scorecards */}
                {inn1 && <InningsScorecard inn={inn1} matchOvers={match.overs} />}
                {inn2 && <InningsScorecard inn={inn2} matchOvers={match.overs} />}
                {/* Performance Highlights */}
                {(inn1 || inn2) && <PerformanceHighlights inn1={inn1} inn2={inn2} t1={t1} t2={t2} />}
              </div>
            )}

            {tab === "scoring" && isAdmin && (
              <ScoringPanel
                scorecard={scorecard}
                matchId={id!}
                startInnings={startInnings}
                addBall={addBall}
                undoBall={undoBall}
                completeInnings={completeInnings}
                updateMatch={updateMatch}
                updateLineup={updateLineup}
              />
            )}
          </>
        )}

        {/* Upcoming match info */}
        {match.status === "upcoming" && (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <span className="text-4xl mb-4 block">🏏</span>
            <h3 className="font-heading text-xl text-white uppercase tracking-wide">Match Upcoming</h3>
            <p className="text-white/40 mt-2 text-sm">{match.matchDate ? `Scheduled: ${new Date(match.matchDate).toLocaleString()}` : "Date TBA"}</p>
            {isAdmin && (
              <div className="mt-6">
                <ScoringPanel
                  scorecard={scorecard}
                  matchId={id!}
                  startInnings={startInnings}
                  addBall={addBall}
                  undoBall={undoBall}
                  completeInnings={completeInnings}
                  updateMatch={updateMatch}
                  updateLineup={updateLineup}
                />
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
