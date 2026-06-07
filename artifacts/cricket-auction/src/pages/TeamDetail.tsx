import { useState, useEffect } from "react";
import { useData, Player } from "@/context/DataContext";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { PlayerForm } from "@/components/PlayerForm";
import { SquadPlayerCard } from "@/components/SquadPlayerCard";
import { ArrowLeft, MapPin, Users, Star, ShieldCheck, Zap, CalendarDays, Trophy, CheckCircle2 } from "lucide-react";
import { useMatches, SplMatch } from "@/hooks/useMatches";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { teams, players } = useData();
  const { matches } = useMatches();

  const [isOwner, setIsOwner] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"squad" | "matches">("squad");

  useEffect(() => {
    setIsOwner(sessionStorage.getItem("splAdmin") === "1");
  }, []);

  const teamMatches = matches.filter(m => m.team1Id === id || m.team2Id === id);

  const team = teams.find((t) => t.id === id);
  const teamPlayers = players.filter((p) => p.teamId === id);

  const openDetail = (player: Player) => {
    setSelectedPlayer(player);
    setDetailOpen(true);
  };

  const openEdit = (player: Player) => {
    setEditPlayer(player);
    setEditOpen(true);
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <h1 className="font-heading text-4xl text-white">Team not found</h1>
          <Link href="/" className="mt-4 text-primary hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const availablePoints = team.totalPoints - team.usedPoints;
  const usedPct = team.totalPoints > 0 ? Math.round((team.usedPoints / team.totalPoints) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-foreground flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Hero */}
        <div className="relative pt-8 sm:pt-12 pb-16 sm:pb-20 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 50%, ${team.color} 0%, transparent 65%)` }} />
          <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ backgroundColor: team.color }} />

          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
              {isOwner && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Owner Mode
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Logo */}
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex-shrink-0 flex items-center justify-center p-3 shadow-2xl bg-black/50 backdrop-blur"
                style={{ border: `2px solid ${team.color}50` }}
              >
                {team.logo && !team.logo.startsWith("/images/") ? (
                  <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center font-heading text-xl text-white/40">
                    {team.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="font-heading text-4xl sm:text-6xl text-white tracking-wider uppercase mb-2 truncate" style={{ textShadow: `0 0 40px ${team.color}40` }}>
                  {team.name}
                </h1>
                <p className="text-sm sm:text-base text-white/60 mb-5 leading-relaxed max-w-xl">{team.description}</p>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: team.color }} />
                    <span className="text-white/80 font-medium">{team.location}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 text-sm">
                    <Users className="w-4 h-4 flex-shrink-0" style={{ color: team.color }} />
                    <span className="text-white/80 font-medium">{teamPlayers.length} Players</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/5 px-3 py-2 rounded-lg border border-white/10 min-w-[180px]">
                    <Star className="w-4 h-4 flex-shrink-0" style={{ color: team.color }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-white/50">Points</span>
                        <span className="font-bold text-white">{availablePoints}/{team.totalPoints}</span>
                      </div>
                      <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${usedPct}%`, backgroundColor: team.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 mb-6 w-fit">
            <button onClick={() => setActiveTab("squad")}
              className={`font-heading text-sm tracking-wide px-6 py-2 rounded-md transition-all ${activeTab === "squad" ? "bg-primary text-primary-foreground" : "text-white/50 hover:text-white"}`}>
              Squad
            </button>
            <button onClick={() => setActiveTab("matches")}
              className={`font-heading text-sm tracking-wide px-6 py-2 rounded-md transition-all flex items-center gap-1.5 ${activeTab === "matches" ? "bg-primary text-primary-foreground" : "text-white/50 hover:text-white"}`}>
              <Zap className="w-3.5 h-3.5" /> Matches {teamMatches.length > 0 && <span className="text-[10px] bg-white/20 rounded-full w-4 h-4 flex items-center justify-center">{teamMatches.length}</span>}
            </button>
          </div>

          {activeTab === "squad" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-wider uppercase">{team.name} · Squad</h2>
                  {isOwner && <p className="text-xs text-white/40 mt-0.5">Hover a card and tap ✏️ to edit a player</p>}
                </div>
                <span className="text-sm text-white/30 font-semibold">{teamPlayers.length} players</span>
              </div>
              {teamPlayers.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <span className="text-4xl mb-4 block">🏏</span>
                  <h3 className="font-heading text-2xl text-white tracking-wide uppercase">Squad Empty</h3>
                  <p className="text-white/40 mt-2 text-sm">No players assigned to this team yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {teamPlayers.map((player, i) => (
                    <SquadPlayerCard key={player.id} player={player} team={team} index={i} isOwner={isOwner} onClick={openDetail} onEdit={openEdit} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "matches" && (
            <div className="space-y-4">
              {teamMatches.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <span className="text-3xl mb-3 block">📅</span>
                  <h3 className="font-heading text-xl text-white uppercase">No Matches</h3>
                  <p className="text-white/40 mt-2 text-sm">No matches scheduled for this team.</p>
                </div>
              ) : (
                <>
                  {["ongoing", "upcoming", "completed"].map(status => {
                    const filtered = teamMatches.filter(m => m.status === status);
                    if (!filtered.length) return null;
                    return (
                      <div key={status}>
                        <div className="flex items-center gap-2 mb-3">
                          {status === "ongoing" && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                          {status === "upcoming" && <CalendarDays className="w-4 h-4 text-yellow-400" />}
                          {status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          <span className="font-heading text-sm text-white/60 uppercase tracking-wider">{status}</span>
                        </div>
                        <div className="space-y-2">
                          {filtered.map(m => {
                            const opp = m.team1Id === id ? m.team2 : m.team1;
                            const inn = (m as any).innings ?? [];
                            const myInn = inn.find((i: any) => i.battingTeamId === id);
                            const oppInn = inn.find((i: any) => i.battingTeamId !== id);
                            return (
                              <Link key={m.id} href={`/match/${m.id}`}>
                                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white">vs {opp?.name ?? "TBD"}</p>
                                    <p className="text-[10px] text-white/40 mt-0.5">{m.venue || "SPL"} · {m.overs} ov{m.matchDate ? ` · ${new Date(m.matchDate).toLocaleDateString()}` : ""}</p>
                                  </div>
                                  <div className="text-right text-sm">
                                    {myInn && <p className="font-bold text-white">{myInn.totalRuns}/{myInn.totalWickets}</p>}
                                    {oppInn && <p className="text-white/50">{oppInn.totalRuns}/{oppInn.totalWickets}</p>}
                                    {m.status === "completed" && m.winner && (
                                      <p className={`text-[10px] font-bold mt-1 ${m.winner.id === id ? "text-emerald-400" : "text-red-400"}`}>
                                        {m.winner.id === id ? "WON" : "LOST"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Season footer bar */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white/40"
          >
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>Squad Size: <span className="text-white/70 font-semibold">{teamPlayers.length} / 25</span></span>
            </div>
            <span className="font-semibold text-white/30 uppercase tracking-wider">Season 2025-26</span>
          </div>
        </div>
      </main>

      <Footer />

      {/* View modal (read-only for public, owner sees same) */}
      <PlayerDetailModal
        player={selectedPlayer}
        team={team}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Edit modal (owner only) */}
      {isOwner && (
        <PlayerForm
          open={editOpen}
          onOpenChange={(v) => { if (!v) { setEditOpen(false); setEditPlayer(null); } }}
          playerToEdit={editPlayer}
        />
      )}
    </div>
  );
}
