import { useState, useEffect } from "react";
import { useData, Player } from "@/context/DataContext";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { PlayerForm } from "@/components/PlayerForm";
import { SquadPlayerCard } from "@/components/SquadPlayerCard";
import { ArrowLeft, MapPin, Users, Star, ShieldCheck } from "lucide-react";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { teams, players } = useData();

  const [isOwner, setIsOwner] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setIsOwner(sessionStorage.getItem("splAdmin") === "1");
  }, []);

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

        {/* Squad Section */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-wider uppercase">
                {team.name} · Squad
              </h2>
              {isOwner && (
                <p className="text-xs text-white/40 mt-0.5">Hover a card and tap ✏️ to edit a player</p>
              )}
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
                <SquadPlayerCard
                  key={player.id}
                  player={player}
                  team={team}
                  index={i}
                  isOwner={isOwner}
                  onClick={openDetail}
                  onEdit={openEdit}
                />
              ))}
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
