import { Player, Team } from "@/context/DataContext";
import { Edit2, Calendar, MapPin, Shield, Star } from "lucide-react";
import { motion } from "framer-motion";

interface SquadPlayerCardProps {
  player: Player;
  team: Team;
  index: number;
  isOwner?: boolean;
  onClick: (player: Player) => void;
  onEdit?: (player: Player) => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

function getTypeStyle(type: Player["playerType"]) {
  switch (type) {
    case "Batsman":       return { bg: "#1d4ed8", label: "Batsman" };
    case "Bowler":        return { bg: "#15803d", label: "Bowler" };
    case "All-Rounder":   return { bg: "#7c3aed", label: "All-Rounder" };
    case "Wicket-Keeper": return { bg: "#b45309", label: "Wicket-Keeper" };
  }
}

export function SquadPlayerCard({ player, team, index, isOwner, onClick, onEdit }: SquadPlayerCardProps) {
  const { bg: typeBg, label: typeLabel } = getTypeStyle(player.playerType);
  const num = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 22 }}
      className="group relative"
    >
      <div
        className="relative bg-[#0f1a2e] border border-white/10 rounded-2xl overflow-hidden cursor-pointer
          hover:border-white/20 hover:shadow-lg hover:shadow-black/40 transition-all duration-200"
        style={{ borderTopColor: `${team.color}60` }}
        onClick={() => onClick(player)}
      >
        {/* Top accent */}
        <div className="h-[3px] w-full" style={{ backgroundColor: team.color }} />

        {/* Number badge */}
        <div
          className="absolute top-3 left-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center font-heading text-xs text-white font-bold shadow"
          style={{ backgroundColor: team.color }}
        >
          {num}
        </div>

        {/* Edit button (owner only) */}
        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(player); }}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center
              text-white/40 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Photo */}
        <div className="px-4 pt-6 pb-2 flex justify-center">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex items-center justify-center font-heading text-3xl text-white shadow-lg"
            style={{
              background: player.photo ? "transparent" : `linear-gradient(135deg, ${team.color}40, ${team.color}10)`,
              border: `2px solid ${team.color}50`,
            }}
          >
            {player.photo ? (
              <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(player.name)
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-3 pb-3 text-center space-y-2">
          <div>
            <h3 className="font-heading text-sm sm:text-base text-white uppercase tracking-wide leading-tight truncate">
              {player.name}
            </h3>
            {player.additionalTag !== "Normal Player" && (
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Shield className="w-2.5 h-2.5 text-yellow-400" />
                <span className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">
                  {player.additionalTag}
                </span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-white/50">
            <span className="flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />{player.age}y
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1 max-w-[80px] truncate">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{player.village}</span>
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-0.5 text-primary font-bold">
              <Star className="w-2.5 h-2.5 fill-primary" />{player.points}
            </span>
          </div>

          {/* Type badge */}
          <div className="pt-1">
            <span
              className="inline-flex items-center justify-center w-full py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: typeBg }}
            >
              {typeLabel}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
