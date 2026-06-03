import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useData } from "@/context/DataContext";
import { PlayerCard } from "@/components/PlayerCard";
import { TeamCard } from "@/components/TeamCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicDashboard() {
  const { players, teams } = useData();
  const [, setLocation] = useLocation();

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
      if (sortBy === "Name Z-A") return b.name.localeCompare(a.name);
      if (sortBy === "Age (Low-High)") return a.age - b.age;
      if (sortBy === "Age (High-Low)") return b.age - a.age;
      if (sortBy === "Recently Added") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="players" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-4xl sm:text-5xl text-white tracking-wider uppercase">Live Auction</h1>
              <p className="text-muted-foreground mt-1">Real-time player tracking and team formations</p>
            </div>
            <TabsList className="bg-white/5 border border-white/10 h-12 p-1">
              <TabsTrigger value="players" className="font-heading text-lg tracking-wide px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Players</TabsTrigger>
              <TabsTrigger value="teams" className="font-heading text-lg tracking-wide px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Teams</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="players" className="mt-0 outline-none">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-3xl font-heading text-white">{players.length}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Players</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-3xl font-heading text-emerald-400">{availableCount}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/70">Available</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-3xl font-heading text-red-400">{soldCount}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400/70">Sold</span>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-3xl font-heading text-primary">{teams.length}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary/70">Teams</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search players or villages..." 
                  className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-4 items-center">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground hidden sm:block" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] bg-black/20 border-white/10 h-10 text-xs uppercase tracking-wider font-semibold">
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
                  <SelectTrigger className="w-[120px] bg-black/20 border-white/10 h-10 text-xs uppercase tracking-wider font-semibold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-[140px] bg-black/20 border-white/10 h-10 text-xs uppercase tracking-wider font-semibold">
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
                  <SelectTrigger className="w-[150px] bg-black/20 border-white/10 h-10 text-xs uppercase tracking-wider font-semibold">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Name A-Z">Name A-Z</SelectItem>
                    <SelectItem value="Name Z-A">Name Z-A</SelectItem>
                    <SelectItem value="Age (Low-High)">Age (Low-High)</SelectItem>
                    <SelectItem value="Age (High-Low)">Age (High-Low)</SelectItem>
                    <SelectItem value="Recently Added">Recently Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid */}
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-white/10 rounded-xl bg-white/5">
                <span className="text-4xl mb-4 block">🏏</span>
                <h3 className="font-heading text-2xl text-white tracking-wide uppercase">No players found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredPlayers.map((player) => {
                    const team = player.teamId ? teams.find((t) => t.id === player.teamId) : null;
                    return (
                      <PlayerCard key={player.id} player={player} team={team} />
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="teams" className="mt-0 outline-none">
            {teams.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-white/10 rounded-xl bg-white/5">
                <span className="text-4xl mb-4 block">🛡️</span>
                <h3 className="font-heading text-2xl text-white tracking-wide uppercase">No teams found</h3>
                <p className="text-muted-foreground mt-2">Teams will appear here once added.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
