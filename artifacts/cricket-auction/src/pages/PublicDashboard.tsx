import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useData } from "@/context/DataContext";
import { PlayerCard } from "@/components/PlayerCard";
import { TeamCard } from "@/components/TeamCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicDashboard() {
  const { players, teams } = useData();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<"players" | "teams">("players");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Name A-Z");

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
      if (sortBy === "Recently Added") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-foreground flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">

        {/* Header + Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-8">
          <div>
            <h1 className="font-heading text-3xl sm:text-5xl text-white tracking-wider uppercase leading-none">Live Auction</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Real-time player tracking and team formations</p>
          </div>
          {/* Custom Tab Buttons */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("players")}
              className={`font-heading text-sm sm:text-base tracking-wide px-5 sm:px-8 py-2 rounded-md transition-all ${
                activeTab === "players"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Players
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className={`font-heading text-sm sm:text-base tracking-wide px-5 sm:px-8 py-2 rounded-md transition-all ${
                activeTab === "teams"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Teams
            </button>
          </div>
        </div>

        {/* Players Tab */}
        {activeTab === "players" && (
          <div>
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-8">
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

            {/* Filters */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 mb-5 sm:mb-8 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-players"
                />
              </div>
              {/* Filter dropdowns — 2x2 on mobile, 4-in-row on md+ */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-9 text-[11px] uppercase tracking-wider font-semibold w-full" data-testid="select-type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                    <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-9 text-[11px] uppercase tracking-wider font-semibold w-full" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-9 text-[11px] uppercase tracking-wider font-semibold w-full" data-testid="select-tag-filter">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tags</SelectItem>
                    <SelectItem value="Normal Player">Normal</SelectItem>
                    <SelectItem value="Captain">Captain</SelectItem>
                    <SelectItem value="Vice Captain">Vice Captain</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-9 text-[11px] uppercase tracking-wider font-semibold w-full" data-testid="select-sort">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Name A-Z">Name A-Z</SelectItem>
                    <SelectItem value="Age">Age</SelectItem>
                    <SelectItem value="Recently Added">Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Player Grid */}
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5">
                <span className="text-3xl mb-3 block">🏏</span>
                <h3 className="font-heading text-xl text-white tracking-wide uppercase">No players found</h3>
                <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredPlayers.map((player) => {
                    const team = player.teamId ? teams.find((t) => t.id === player.teamId) : null;
                    return <PlayerCard key={player.id} player={player} team={team} />;
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === "teams" && (
          <div>
            {teams.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5">
                <span className="text-3xl mb-3 block">🛡️</span>
                <h3 className="font-heading text-xl text-white tracking-wide uppercase">No teams yet</h3>
                <p className="text-muted-foreground text-sm mt-1">Teams will appear here once added.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {teams.map((team) => {
                  const teamPlayersCount = players.filter((p) => p.teamId === team.id).length;
                  return (
                    <TeamCard
                      key={team.id}
                      team={team}
                      playerCount={teamPlayersCount}
                      onClick={() => setLocation(`/team/${team.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
