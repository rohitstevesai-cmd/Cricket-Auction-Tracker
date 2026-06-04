import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Player } from "@/context/DataContext";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { ArrowLeft, MapPin, Users, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { teams, players } = useData();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (player: Player) => {
    setSelectedPlayer(player);
    setDetailOpen(true);
  };

  const team = teams.find((t) => t.id === id);
  const teamPlayers = players.filter((p) => p.teamId === id);

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

      <main className="flex-1 pb-12">
        {/* Header Hero */}
        <div className="relative pt-8 sm:pt-12 pb-16 sm:pb-24 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${team.color} 0%, transparent 70%)` }} />
          <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: team.color }} />
          
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm font-semibold uppercase tracking-wider">
              <ArrowLeft className="w-4 h-4" /> Back to Teams
            </Link>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl flex-shrink-0 flex items-center justify-center p-4 shadow-2xl bg-black/40 backdrop-blur"
                style={{ border: `2px solid ${team.color}40` }}
              >
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center font-heading text-2xl text-white/50">LOGO</div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="font-heading text-5xl md:text-7xl text-white tracking-wider uppercase mb-4" style={{ textShadow: `0 0 40px ${team.color}40` }}>
                  {team.name}
                </h1>
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-6 leading-relaxed">{team.description}</p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <MapPin className="w-5 h-5" style={{ color: team.color }} />
                    <span className="font-semibold text-white/90">{team.location}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <Users className="w-5 h-5" style={{ color: team.color }} />
                    <span className="font-semibold text-white/90">{teamPlayers.length} / 25 Squad Size</span>
                  </div>
                  {/* Points Budget */}
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10 min-w-[200px]">
                    <Star className="w-5 h-5 flex-shrink-0" style={{ color: team.color }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/60">Points Budget</span>
                        <span className="font-bold text-white">{availablePoints} / {team.totalPoints} left</span>
                      </div>
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${usedPct}%`, backgroundColor: team.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Squad Grid */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-10 sm:mt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl text-white tracking-wider uppercase">Current Squad</h2>
            <span className="text-sm text-white/40">{teamPlayers.length} players</span>
          </div>

          {teamPlayers.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-white/10 rounded-xl bg-white/5">
              <span className="text-4xl mb-4 block">🏏</span>
              <h3 className="font-heading text-2xl text-white tracking-wide uppercase">Squad Empty</h3>
              <p className="text-muted-foreground mt-2">No players have been assigned to this team yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {teamPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} team={team} onClick={openDetail} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <PlayerDetailModal
        player={selectedPlayer}
        team={team}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
