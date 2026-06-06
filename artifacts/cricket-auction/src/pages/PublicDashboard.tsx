import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useData } from "@/context/DataContext";
import { Player } from "@/context/DataContext";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { TeamCard } from "@/components/TeamCard";
import { Input } from "@/components/ui/input";
import { Search, Star, Trophy, Crown, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

function getTypeShort(type: Player["playerType"]) {
  switch (type) {
    case "Batsman":       return "BAT";
    case "Bowler":        return "BOWL";
    case "All-Rounder":   return "AR";
    case "Wicket-Keeper": return "WK";
  }
}

function getTypeColor(type: Player["playerType"]) {
  switch (type) {
    case "Batsman":       return "#3b82f6";
    case "Bowler":        return "#22c55e";
    case "All-Rounder":   return "#a855f7";
    case "Wicket-Keeper": return "#f59e0b";
  }
}

export default function PublicDashboard() {
  const { players, teams, lastUpdated } = useData();
  const [, setLocation] = useLocation();
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      const sec = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (sec < 5) setTimeAgo("just now");
      else if (sec < 60) setTimeAgo(`${sec}s ago`);
      else setTimeAgo(`${Math.floor(sec / 60)}m ago`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const [activeTab, setActiveTab] = useState<"players" | "teams">("players");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Name A-Z");

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (player: Player) => {
    setSelectedPlayer(player);
    setDetailOpen(true);
  };

  const availableCount = players.filter((p) => p.status === "available").length;
  const soldCount = players.filter((p) => p.status === "sold").length;

  const filteredPlayers = players
    .filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.village.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "All" && p.playerType !== typeFilter) return false;
      if (statusFilter !== "All" && p.status !== statusFilter.toLowerCase()) return false;
      if (tagFilter !== "All" && p.additionalTag !== tagFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Name A-Z") return a.name.localeCompare(b.name);
      if (sortBy === "Age") return a.age - b.age;
      if (sortBy === "Points") return (b.points ?? 0) - (a.points ?? 0);
      if (sortBy === "Recently Added") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  const selectedTeam = selectedPlayer?.teamId ? teams.find(t => t.id === selectedPlayer.teamId) : null;

  // ── Top Players logic ─────────────────────────────────────────────────
  const captains = players
    .filter(p => p.additionalTag === "Captain")
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const viceCaptains = players
    .filter(p => p.additionalTag === "Vice Captain")
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const topRest = players
    .filter(p => p.additionalTag === "Normal Player")
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 6);
  const featuredPlayers = [...captains, ...viceCaptains, ...topRest];

  // ── Team Leaderboard logic ────────────────────────────────────────────
  const rankedTeams = [...teams]
    .map(team => ({
      ...team,
      playerCount: players.filter(p => p.teamId === team.id).length,
      usedPct: team.totalPoints > 0 ? Math.round((team.usedPoints / team.totalPoints) * 100) : 0,
      remaining: team.totalPoints - team.usedPoints,
    }))
    .sort((a, b) => b.playerCount - a.playerCount || b.usedPoints - a.usedPoints);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-foreground flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">

        {/* ── Header + Tabs ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading text-3xl sm:text-5xl text-white tracking-wider uppercase leading-none">Live Auction</h1>
              <span className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-full px-2.5 py-1 self-end mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Live</span>
              </span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Real-time tracking
              {timeAgo && (
                <span className="ml-2 text-white/30">· updated {timeAgo}</span>
              )}
            </p>
          </div>
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("players")}
              className={`font-heading text-sm sm:text-base tracking-wide px-5 sm:px-8 py-2 rounded-md transition-all ${activeTab === "players" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              Players
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className={`font-heading text-sm sm:text-base tracking-wide px-5 sm:px-8 py-2 rounded-md transition-all ${activeTab === "teams" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              Teams
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            PLAYERS TAB
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "players" && (
          <div>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-5">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-3xl font-heading text-white leading-none">{players.length}</span>
                <span className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1 leading-tight">Total</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 sm:p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-3xl font-heading text-emerald-400 leading-none">{availableCount}</span>
                <span className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400/70 mt-1 leading-tight">Available</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 sm:p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-3xl font-heading text-red-400 leading-none">{soldCount}</span>
                <span className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-red-400/70 mt-1 leading-tight">Sold</span>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-2 sm:p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-3xl font-heading text-primary leading-none">{teams.length}</span>
                <span className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-primary/70 mt-1 leading-tight">Teams</span>
              </div>
            </div>

            {/* ── TOP PLAYERS STRIP ──────────────────────────────── */}
            {featuredPlayers.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Featured Players</span>
                </div>

                {/* Horizontal scroll strip */}
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                  {featuredPlayers.map((player) => {
                    const team = player.teamId ? teams.find(t => t.id === player.teamId) : null;
                    const isCaptain = player.additionalTag === "Captain";
                    const isViceCaptain = player.additionalTag === "Vice Captain";
                    const typeColor = getTypeColor(player.playerType);
                    const accentColor = team ? team.color : typeColor;

                    return (
                      <motion.button
                        key={player.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => openDetail(player)}
                        className="flex-shrink-0 snap-start relative rounded-xl overflow-hidden border transition-all active:scale-95"
                        style={{
                          width: 120,
                          background: `linear-gradient(160deg, ${accentColor}12 0%, #0a0f1c 60%)`,
                          borderColor: isCaptain ? `${accentColor}60` : isViceCaptain ? `${accentColor}45` : `${accentColor}25`,
                        }}
                      >
                        {/* Top accent line */}
                        <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

                        <div className="p-2.5 flex flex-col items-center text-center gap-1.5">
                          {/* Avatar */}
                          <div
                            className="rounded-full overflow-hidden flex-shrink-0"
                            style={{
                              width: 44, height: 44,
                              border: `2px solid ${accentColor}50`,
                              background: player.photo ? "transparent" : `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                            }}
                          >
                            {player.photo ? (
                              <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-heading text-sm text-white">
                                {getInitials(player.name)}
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <p className="font-heading text-[11px] text-white leading-tight w-full truncate">
                            {player.name.split(" ")[0]}
                          </p>

                          {/* Role badge + captain crown */}
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${typeColor}20`, color: typeColor }}
                            >
                              {getTypeShort(player.playerType)}
                            </span>
                            {isCaptain && (
                              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-yellow-400/20 text-yellow-400">C</span>
                            )}
                            {isViceCaptain && (
                              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-orange-400/20 text-orange-400">VC</span>
                            )}
                          </div>

                          {/* Points */}
                          <div className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                            <span className="text-[10px] font-bold text-primary">{player.points}</span>
                          </div>

                          {/* Team / Status pill */}
                          <div
                            className="w-full text-center text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded-full truncate"
                            style={team
                              ? { background: `${team.color}20`, color: team.color }
                              : { background: "rgba(52,211,153,0.12)", color: "#34d399" }
                            }
                          >
                            {team ? team.name.split(" ")[0] : "Available"}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 mb-5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search players..." className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-9 text-[11px] uppercase tracking-wider font-semibold w-full"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                    <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-9 text-[11px] uppercase tracking-wider font-semibold w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-9 text-[11px] uppercase tracking-wider font-semibold w-full"><SelectValue placeholder="Tag" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tags</SelectItem>
                    <SelectItem value="Normal Player">Normal</SelectItem>
                    <SelectItem value="Captain">Captain</SelectItem>
                    <SelectItem value="Vice Captain">Vice Captain</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-9 text-[11px] uppercase tracking-wider font-semibold w-full"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Name A-Z">Name A-Z</SelectItem>
                    <SelectItem value="Age">Age</SelectItem>
                    <SelectItem value="Points">Points ↓</SelectItem>
                    <SelectItem value="Recently Added">Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Player grid */}
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5">
                <span className="text-3xl mb-3 block">🏏</span>
                <h3 className="font-heading text-xl text-white tracking-wide uppercase">No players found</h3>
                <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredPlayers.map((player) => {
                    const team = player.teamId ? teams.find((t) => t.id === player.teamId) : null;
                    return <PlayerCard key={player.id} player={player} team={team} onClick={openDetail} />;
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TEAMS TAB
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "teams" && (
          <div>
            {teams.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5">
                <span className="text-3xl mb-3 block">🛡️</span>
                <h3 className="font-heading text-xl text-white tracking-wide uppercase">No teams yet</h3>
                <p className="text-muted-foreground text-sm mt-1">Teams will appear here once added.</p>
              </div>
            ) : (
              <div className="space-y-5">

                {/* ── TEAM LEADERBOARD ─────────────────────────── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Team Standings</span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-white/10">
                    {rankedTeams.map((team, index) => {
                      const rank = index + 1;
                      const isFirst = rank === 1;
                      const isSecond = rank === 2;
                      const isThird = rank === 3;

                      return (
                        <motion.button
                          key={team.id}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setLocation(`/team/${team.id}`)}
                          className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 transition-colors hover:bg-white/5 active:bg-white/10 text-left border-b border-white/5 last:border-b-0"
                          style={{
                            background: isFirst
                              ? `linear-gradient(90deg, ${team.color}18 0%, transparent 60%)`
                              : "transparent",
                          }}
                        >
                          {/* Rank */}
                          <div className="flex-shrink-0 w-7 flex items-center justify-center">
                            {isFirst ? (
                              <span className="text-base">🥇</span>
                            ) : isSecond ? (
                              <span className="text-base">🥈</span>
                            ) : isThird ? (
                              <span className="text-base">🥉</span>
                            ) : (
                              <span className="text-[11px] font-bold text-white/30">#{rank}</span>
                            )}
                          </div>

                          {/* Color bar + Logo */}
                          <div
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center p-1"
                            style={{ background: `${team.color}18`, border: `1px solid ${team.color}35` }}
                          >
                            {team.logo ? (
                              <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                            ) : (
                              <Shield className="w-4 h-4" style={{ color: team.color }} />
                            )}
                          </div>

                          {/* Name + progress */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span
                                className="font-heading text-sm text-white truncate leading-none"
                                style={isFirst ? { color: team.color } : {}}
                              >
                                {team.name}
                              </span>
                              <span className="text-[10px] text-white/40 flex-shrink-0">
                                <span className="font-bold text-white/70">{team.playerCount}</span> players
                              </span>
                            </div>

                            {/* Budget bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: team.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${team.usedPct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                                />
                              </div>
                              <span className="text-[9px] font-bold text-white/40 flex-shrink-0 w-14 text-right">
                                <span className={team.remaining < 20 ? "text-red-400" : "text-white/60"}>
                                  {team.remaining}
                                </span>
                                <span className="text-white/25"> / {team.totalPoints}</span>
                              </span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <span className="text-white/20 flex-shrink-0 text-lg leading-none">›</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* ── TEAM CARDS ────────────────────────────────── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">All Teams</span>
                  </div>
                  <div className="space-y-4">
                    {teams.map((team) => {
                      const teamPlayers = players.filter((p) => p.teamId === team.id);
                      return (
                        <div key={team.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                          <div
                            className="cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => setLocation(`/team/${team.id}`)}
                          >
                            <TeamCard team={team} playerCount={teamPlayers.length} />
                          </div>

                          {teamPlayers.length > 0 && (
                            <div className="border-t border-white/10 px-3 pb-3 pt-2">
                              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2 font-semibold">Squad</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {teamPlayers.map(player => (
                                  <div
                                    key={player.id}
                                    onClick={(e) => { e.stopPropagation(); openDetail(player); }}
                                    className="flex items-center gap-2 bg-black/30 border border-white/5 hover:border-white/20 rounded-lg p-2 cursor-pointer transition-colors group"
                                  >
                                    <div
                                      className="flex-shrink-0 rounded-full overflow-hidden"
                                      style={{
                                        width: 32, height: 32,
                                        border: `1.5px solid ${team.color}50`,
                                        background: player.photo ? "transparent" : `${team.color}20`,
                                      }}
                                    >
                                      {player.photo ? (
                                        <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center font-heading text-[10px] text-white">
                                          {getInitials(player.name)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-bold text-white leading-tight truncate group-hover:text-primary transition-colors">{player.name.split(" ")[0]}</p>
                                      <p className="text-[9px] text-white/40">{getTypeShort(player.playerType)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      <PlayerDetailModal
        player={selectedPlayer}
        team={selectedTeam}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
