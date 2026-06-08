import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useData } from "@/context/DataContext";
import { useScorecard, SplInnings, SplBall } from "@/hooks/useMatches";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, LineChart, Line, Legend, ReferenceLine,
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
function LiveScoreTicker({ activeInnings, notOutBatsmen, currentBowler }: {
  activeInnings: SplInnings;
  notOutBatsmen: any[];
  currentBowler: any;
}) {
  const bat1 = notOutBatsmen[0]; // striker
  const bat2 = notOutBatsmen[1]; // non-striker
  const totalBalls = activeInnings.oversCompleted * 6 + activeInnings.ballsCurrentOver;
  const crr = totalBalls > 0 ? (activeInnings.totalRuns / (totalBalls / 6)).toFixed(2) : "0.00";
  const sr1 = bat1 && bat1.balls > 0 ? ((bat1.runs / bat1.balls) * 100).toFixed(0) : "—";
  const sr2 = bat2 && bat2.balls > 0 ? ((bat2.runs / bat2.balls) * 100).toFixed(0) : "—";
  const teamColor = activeInnings.battingTeam?.color || "#3b82f6";

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
        {/* Column headers */}
        <div className="flex items-center mb-1">
          <div className="w-3 flex-shrink-0" />
          <div className="flex-1 min-w-0" />
          <div className="w-8 text-right text-[9px] text-white/25 uppercase tracking-wide flex-shrink-0">R</div>
          <div className="w-8 text-right text-[9px] text-white/25 uppercase tracking-wide flex-shrink-0">B</div>
          <div className="w-10 text-right text-[9px] text-white/25 uppercase tracking-wide flex-shrink-0">SR</div>
        </div>

        {/* Striker row */}
        {bat1 ? (
          <div className="flex items-center gap-1.5 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
            {/* Pulsing red ball = ON STRIKE */}
            <div className="w-3 flex-shrink-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <span className="font-bold text-white text-[12px] flex-1 min-w-0 truncate">
              {bat1.player?.name ?? "—"}
              <span className="text-red-400 ml-0.5">*</span>
            </span>
            <span className="w-8 text-right font-black text-white text-[13px] tabular-nums flex-shrink-0">{bat1.runs}</span>
            <span className="w-8 text-right text-white/45 text-[11px] tabular-nums flex-shrink-0">({bat1.balls})</span>
            <span className="w-10 text-right text-amber-400 text-[10px] font-bold tabular-nums flex-shrink-0">{sr1}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <div className="w-3 flex-shrink-0" />
            <span className="text-white/25 text-[11px] italic">Waiting...</span>
          </div>
        )}

        {/* Non-striker row */}
        {bat2 ? (
          <div className="flex items-center gap-1.5 py-1">
            <div className="w-3 flex-shrink-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
            </div>
            <span className="font-medium text-white/65 text-[12px] flex-1 min-w-0 truncate">{bat2.player?.name ?? "—"}</span>
            <span className="w-8 text-right text-white/60 text-[12px] tabular-nums flex-shrink-0">{bat2.runs}</span>
            <span className="w-8 text-right text-white/30 text-[11px] tabular-nums flex-shrink-0">({bat2.balls})</span>
            <span className="w-10 text-right text-white/25 text-[10px] tabular-nums flex-shrink-0">{sr2}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <div className="w-3 flex-shrink-0" />
            <span className="text-white/20 text-[11px] italic">New batsman...</span>
          </div>
        )}
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

// ── Charts ───────────────────────────────────────────────────────────────────
function Charts({ inn1, inn2, matchOvers }: { inn1?: SplInnings; inn2?: SplInnings; matchOvers: number }) {
  if (!inn1) return null;

  // Merge worm data
  const maxOver = Math.max(
    inn1.wormData.length > 0 ? inn1.wormData[inn1.wormData.length - 1].over : 0,
    inn2 && inn2.wormData.length > 0 ? inn2.wormData[inn2.wormData.length - 1].over : 0,
  );

  const wormMerged: any[] = [];
  for (let i = 1; i <= maxOver; i++) {
    wormMerged.push({
      over: i,
      [inn1.battingTeam?.name ?? "Team1"]: inn1.wormData.find(d => d.over === i)?.runs ?? null,
      [inn2?.battingTeam?.name ?? "Team2"]: inn2?.wormData.find(d => d.over === i)?.runs ?? null,
    });
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
        const maxOv = Math.max(
          inn1.overHistory.length > 0 ? inn1.overHistory[inn1.overHistory.length - 1].over : 0,
          inn2 && inn2.overHistory.length > 0 ? inn2.overHistory[inn2.overHistory.length - 1].over : 0,
        );
        const rrMerged: any[] = [];
        for (let i = 1; i <= maxOv; i++) {
          rrMerged.push({
            over: i,
            [t1Name]: inn1.overHistory.find((o: any) => o.over === i)?.runs ?? null,
            ...(inn2 ? { [t2Name]: inn2.overHistory.find((o: any) => o.over === i)?.runs ?? null } : {}),
          });
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
              {inn2 && (
                <span className="flex items-center gap-1 text-[10px] text-white/50">
                  <span className="w-3 h-2 rounded-sm inline-block" style={{ background: t2Color }} /> {t2Name}
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={rrMerged} barSize={inn2 ? 10 : 16} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="over" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <RTooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  formatter={(v: any, name: any) => [`${v} runs`, name]}
                />
                <Bar dataKey={t1Name} fill={t1Color} radius={[3, 3, 0, 0]} />
                {inn2 && <Bar dataKey={t2Name} fill={t2Color} radius={[3, 3, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* Worm Chart */}
      {maxOver > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Run Progression (Worm)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={wormMerged}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="over" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <RTooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }} />
              <Line type="monotone" dataKey={inn1.battingTeam?.name ?? "Team1"} stroke={t1Color} dot={false} strokeWidth={2} connectNulls />
              {inn2 && <Line type="monotone" dataKey={inn2.battingTeam?.name ?? "Team2"} stroke={t2Color} dot={false} strokeWidth={2} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

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
              <Line type="monotone" dataKey="prob" stroke={t2Color} dot={false} strokeWidth={2} name="prob" />
              <Line type="monotone" dataKey="prob2" stroke={t1Color} dot={false} strokeWidth={2} name="prob2" />
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
}

function ScoringPanel({ scorecard, matchId, startInnings, addBall, undoBall, completeInnings, updateMatch }: ScoringPanelProps) {
  const { players, teams } = useData();

  const match = scorecard?.match;
  const inn1 = scorecard?.innings?.find((i: any) => i.inningsNumber === 1);
  const inn2 = scorecard?.innings?.find((i: any) => i.inningsNumber === 2);
  const activeInnings: SplInnings | undefined = scorecard?.innings?.find((i: any) => i.status === "in_progress");

  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
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

      // rotate strike on odd runs off bat (not wide)
      if (extrasType !== "wide" && extrasType !== "noball" && totalRuns % 2 === 1) {
        setStrikerId(prevNonStriker);
        setNonStrikerId(prevStriker);
      }

      // end of over
      if (inn && inn.ballsCurrentOver === 0 && inn.oversCompleted > prevOvers) {
        // Rotate strike at end of over (if even runs)
        if (totalRuns % 2 === 0) {
          setStrikerId(prevNonStriker);
          setNonStrikerId(prevStriker);
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
            <Select value={strikerId} onValueChange={setStrikerId}>
              <SelectTrigger className="bg-black/30 border-white/10 h-8 text-xs"><SelectValue placeholder="On strike" /></SelectTrigger>
              <SelectContent>{battingPlayers.filter(p => !outIds.has(p.id)).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[9px] text-white/40 uppercase tracking-wider mb-1 block">Non-Striker</label>
            <Select value={nonStrikerId} onValueChange={setNonStrikerId}>
              <SelectTrigger className="bg-black/30 border-white/10 h-8 text-xs"><SelectValue placeholder="Non-striker" /></SelectTrigger>
              <SelectContent>{battingPlayers.filter(p => !outIds.has(p.id)).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[9px] text-white/40 uppercase tracking-wider mb-1 block">Bowler</label>
            <Select value={bowlerId} onValueChange={setBowlerId}>
              <SelectTrigger className="bg-black/30 border-white/10 h-8 text-xs"><SelectValue placeholder="Bowler" /></SelectTrigger>
              <SelectContent>{bowlingPlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {strikerId && nonStrikerId && (
          <button
            onClick={() => { const t = strikerId; setStrikerId(nonStrikerId); setNonStrikerId(t); }}
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
                  setNewBowlerId("");
                  setShowNewBowler(false);
                  // Check if also need new batsman
                  if (showNewBatsman) { /* modal already queued */ }
                } else toast.error("Select a bowler");
              }}>Set Bowler</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main MatchDetail Page ─────────────────────────────────────────────────────
export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { scorecard, loading, startInnings, addBall, undoBall, completeInnings, updateMatch } = useScorecard(id, 2000);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"scorecard" | "scoring">("scorecard");

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("splAdmin") === "1");
  }, []);

  const match = scorecard?.match;
  const inn1 = scorecard?.innings?.find((i: SplInnings) => i.inningsNumber === 1);
  const inn2 = scorecard?.innings?.find((i: SplInnings) => i.inningsNumber === 2);
  const activeInnings: SplInnings | undefined = scorecard?.innings?.find((i: SplInnings) => i.status === "in_progress");

  // Current batsmen on crease — last ball's batsmanId = current striker
  const lastBallBatsmanId = activeInnings?.balls?.length
    ? activeInnings.balls[activeInnings.balls.length - 1].batsmanId
    : null;
  const notOutBatsmen = activeInnings
    ? activeInnings.batsmenStats.filter(s => !s.isOut).sort((a, b) => {
        if (a.playerId === lastBallBatsmanId) return -1;
        if (b.playerId === lastBallBatsmanId) return 1;
        const aLast = activeInnings.balls.filter(bl => bl.batsmanId === a.playerId).length;
        const bLast = activeInnings.balls.filter(bl => bl.batsmanId === b.playerId).length;
        return bLast - aLast;
      }).slice(0, 2)
    : [];

  const currentBowler = activeInnings && activeInnings.balls.length > 0
    ? activeInnings.bowlerStats.find(s => s.playerId === activeInnings.balls[activeInnings.balls.length - 1].bowlerId)
    : null;

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

        {/* Live Score Ticker (ongoing) */}
        {activeInnings && notOutBatsmen.length > 0 && (
          <LiveScoreTicker
            activeInnings={activeInnings}
            notOutBatsmen={notOutBatsmen}
            currentBowler={currentBowler}
          />
        )}

        {/* YouTube Live Stream Card */}
        {match.youtubeUrl && match.status === "ongoing" && (
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
