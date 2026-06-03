import { Team } from "@/context/DataContext";
import { MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";

interface TeamCardProps {
  team: Team;
  playerCount: number;
  onClick?: () => void;
}

export function TeamCard({ team, playerCount, onClick }: TeamCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl bg-card border border-white/5 hover:border-white/15 transition-colors shadow-xl cursor-pointer group`}
    >
      {/* Colored top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: team.color }} />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${team.color}, transparent 70%)` }}
      />

      <div className="p-3 flex items-center gap-3 relative z-10">
        {/* Logo */}
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center p-1.5"
          style={{ backgroundColor: `${team.color}18`, border: `1px solid ${team.color}35` }}
        >
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
          ) : (
            <span className="font-heading text-base text-white/40">
              {team.name.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-heading text-base sm:text-lg tracking-wide text-white uppercase leading-tight truncate"
            style={{ textShadow: `0 0 20px ${team.color}30` }}
          >
            {team.name}
          </h3>
          {team.description && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{team.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/50">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: team.color }} />
              {team.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" style={{ color: team.color }} />
              {playerCount} Players
            </span>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 text-lg">›</div>
      </div>
    </motion.div>
  );
}
