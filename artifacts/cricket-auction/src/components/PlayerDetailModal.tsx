import { Player, Team } from "@/context/DataContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, Star, Users, X } from "lucide-react";

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
      <DialogContent className="max-w-[95vw] sm:max-w-lg bg-[#0d1425] border-white/10 text-white p-0 overflow-hidden flex flex-col max-h-[88vh]">
        <DialogTitle className="sr-only">{player.name} — Player Profile</DialogTitle>

        {/* Top accent bar */}
        <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: accentColor }} />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 flex-shrink-0">
          <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Player Profile</span>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* Hero: photo + name + type */}
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center font-heading text-3xl text-white"
              style={{
                width: 72, height: 72,
                border: `2px solid ${accentColor}70`,
                background: player.photo ? "transparent" : `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
              }}
            >
              {player.photo ? (
                <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(player.name)
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-xl text-white uppercase leading-tight truncate">{player.name}</h3>
              <p className="text-sm font-semibold mt-0.5" style={{ color: typeColor }}>{typeText}</p>
              {player.additionalTag !== "Normal Player" && (
                <span className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5 block">{player.additionalTag}</span>
              )}
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Calendar className="w-3 h-3" />, label: "Age", value: `${player.age} Years` },
              { icon: <MapPin className="w-3 h-3" />, label: "Village / City", value: player.village },
              { icon: <Users className="w-3 h-3" />, label: "Position", value: player.playerType },
              { icon: <Star className="w-3 h-3" />, label: "Role", value: player.additionalTag },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <div className="flex items-center gap-1 text-white/40 text-[9px] uppercase tracking-wider mb-1">{icon}{label}</div>
                <p className="text-white text-sm font-semibold leading-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Auction points */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-semibold text-white/80">Auction Points</span>
            </div>
            <span className="font-heading text-2xl text-primary">{player.points}</span>
          </div>

          {/* Auction status */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Auction Status</p>

            {isSold ? (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-heading text-base text-emerald-400 tracking-wider">SOLD</span>
              </div>
            ) : (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-heading text-base text-amber-400 tracking-wider">AVAILABLE</span>
              </div>
            )}

            {isSold && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Sold To</p>
                <div
                  className="flex items-center gap-2.5 p-2.5 rounded-lg"
                  style={{ backgroundColor: `${team.color}15`, border: `1px solid ${team.color}30` }}
                >
                  {team.logo && !team.logo.startsWith("/images/") ? (
                    <img src={team.logo} alt={team.name} className="w-9 h-9 object-contain rounded flex-shrink-0" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center font-heading text-sm text-white flex-shrink-0"
                      style={{ backgroundColor: `${team.color}30` }}
                    >
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-heading text-sm text-white uppercase leading-tight truncate">{team.name}</p>
                    <p className="text-[9px] text-white/40 uppercase tracking-wider">{team.location}</p>
                  </div>
                  <div className="ml-auto flex-shrink-0 text-right">
                    <p className="font-heading text-lg leading-none" style={{ color: team.color }}>{player.points}</p>
                    <p className="text-[9px] text-white/30">pts paid</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Bottom accent bar */}
        <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
      </DialogContent>
    </Dialog>
  );
}
