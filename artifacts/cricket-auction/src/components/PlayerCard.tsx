import { Player, Team } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MapPin, Calendar, Star } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  team?: Team | null;
  onClick?: (player: Player) => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

function getTypeColor(type: Player["playerType"]) {
  switch (type) {
    case "Batsman":       return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "Bowler":        return "bg-green-500/20 text-green-400 border-green-500/40";
    case "All-Rounder":   return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    case "Wicket-Keeper": return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  }
}

function getTypeShort(type: Player["playerType"]) {
  switch (type) {
    case "Batsman":       return "BAT";
    case "Bowler":        return "BOWL";
    case "All-Rounder":   return "AR";
    case "Wicket-Keeper": return "WK";
  }
}

function getTagColor(tag: Player["additionalTag"]) {
  switch (tag) {
    case "Captain":      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    case "Vice Captain": return "bg-orange-500/20 text-orange-400 border-orange-500/40";
    case "Normal Player":return "bg-slate-500/20 text-slate-400 border-slate-500/40";
  }
}

function nameToColor(name: string) {
  const colors = ["#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#10b981","#ef4444","#ec4899","#6366f1"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function PlayerCard({ player, team, onClick }: PlayerCardProps) {
  const isSold = player.status === "sold" && team;
  const accentColor = isSold ? team.color : nameToColor(player.name);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      data-testid={`card-player-${player.id}`}
      onClick={() => onClick?.(player)}
      className={onClick ? "cursor-pointer" : ""}
    >
      <Card
        className={cn(
          "overflow-hidden relative bg-[#111827] border transition-all duration-300 h-full",
          isSold ? "border-white/10" : "border-white/5 hover:border-white/20",
          onClick ? "hover:shadow-lg" : ""
        )}
        style={isSold ? { borderColor: `${team.color}50` } : {}}
      >
        <div className="h-[3px] w-full" style={{ backgroundColor: accentColor }} />

        <CardContent className="p-3">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex-shrink-0 rounded-full overflow-hidden"
              style={{
                width: 48, height: 48,
                border: `2px solid ${accentColor}60`,
                background: player.photo ? "transparent" : `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
              }}
            >
              {player.photo ? (
                <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-heading text-base text-white">
                  {getInitials(player.name)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-sm sm:text-base tracking-wide text-white uppercase leading-tight truncate" title={player.name}>
                {player.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/50 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{player.age} yrs</span>
                <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{player.village}</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 uppercase tracking-wide font-bold leading-none", getTypeColor(player.playerType))}>
              {getTypeShort(player.playerType)}
            </Badge>
            {player.additionalTag !== "Normal Player" && (
              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 uppercase tracking-wide font-bold leading-none", getTagColor(player.additionalTag))}>
                {player.additionalTag === "Vice Captain" ? "V.CAPT" : "CAPT"}
              </Badge>
            )}
            <span className="ml-auto flex items-center gap-0.5 text-[10px] font-bold text-primary">
              <Star className="w-2.5 h-2.5 fill-primary" />{player.points ?? 0}
            </span>
          </div>

          <div className="border-t border-white/5 pt-2">
            {isSold ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Sold</span>
                <span className="text-[10px] text-white/40 mx-0.5">→</span>
                <span className="text-[10px] font-bold truncate" style={{ color: team.color }}>{team.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Available</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
