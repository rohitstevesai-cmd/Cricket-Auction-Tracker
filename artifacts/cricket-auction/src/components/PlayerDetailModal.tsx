import { Player, Team } from "@/context/DataContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, MapPin, Star, Users } from "lucide-react";

interface PlayerDetailModalProps {
  player: Player | null;
  team?: Team | null;
  open: boolean;
  onClose: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

function nameToColor(name: string) {
  const colors = ["#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#10b981","#ef4444","#ec4899","#6366f1"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function typeLabel(type: string) {
  switch (type) {
    case "Batsman": return { label: "Batsman", color: "#3b82f6" };
    case "Bowler": return { label: "Bowler", color: "#10b981" };
    case "All-Rounder": return { label: "All-Rounder", color: "#8b5cf6" };
    case "Wicket-Keeper": return { label: "Wicket-Keeper", color: "#f59e0b" };
    default: return { label: type, color: "#6b7280" };
  }
}

export function PlayerDetailModal({ player, team, open, onClose }: PlayerDetailModalProps) {
  if (!player) return null;

  const isSold = player.status === "sold" && team;
  const accentColor = isSold ? team.color : nameToColor(player.name);
  const { label: typeText, color: typeColor } = typeLabel(player.playerType);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-[#0d1425] border-white/10 text-white p-0 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/40">
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-heading text-sm tracking-widest uppercase text-white/80">Player Profile</h2>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Left: Photo + basic info */}
            <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 sm:w-44">
              <div
                className="flex-shrink-0 rounded-xl overflow-hidden"
                style={{
                  width: 96, height: 96,
                  border: `2px solid ${accentColor}60`,
                  background: player.photo ? "transparent" : `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                }}
              >
                {player.photo ? (
                  <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-heading text-3xl text-white">
                    {getInitials(player.name)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-heading text-xl sm:text-2xl text-white uppercase leading-tight">{player.name}</h3>
                <p className="text-sm font-semibold mt-0.5" style={{ color: typeColor }}>{typeText}</p>
              </div>
            </div>

            {/* Middle: Details */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Calendar className="w-3.5 h-3.5" />, label: "Age", value: `${player.age} Years` },
                  { icon: <MapPin className="w-3.5 h-3.5" />, label: "Village/City", value: player.village },
                  { icon: <Users className="w-3.5 h-3.5" />, label: "Position", value: player.playerType },
                  { icon: <Star className="w-3.5 h-3.5" />, label: "Role", value: player.additionalTag },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] uppercase tracking-wider mb-1">
                      {icon} {label}
                    </div>
                    <p className="text-white text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Points */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm font-semibold text-white/80">Auction Points</span>
                </div>
                <span className="font-heading text-2xl text-primary">{player.points}</span>
              </div>
            </div>

            {/* Right: Auction Status */}
            <div className="sm:w-44 space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Auction Status</p>
                {isSold ? (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-heading text-base text-emerald-400 tracking-wider">SOLD</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-heading text-base text-amber-400 tracking-wider">AVAILABLE</span>
                  </div>
                )}

                {isSold && (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Sold To</p>
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg mb-3"
                      style={{ backgroundColor: `${team.color}15`, border: `1px solid ${team.color}30` }}
                    >
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain rounded" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center font-heading text-xs text-white/50">
                          {team.name.substring(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-heading text-sm text-white uppercase leading-tight truncate">{team.name}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-wider">Team</p>
                      </div>
                    </div>

                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Points Paid</p>
                    <p className="font-heading text-2xl" style={{ color: team.color }}>{player.points}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">auction points</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Colored bottom bar */}
        <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
      </DialogContent>
    </Dialog>
  );
}
