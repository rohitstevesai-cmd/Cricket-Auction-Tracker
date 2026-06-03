import { Player, Team } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PlayerCardProps {
  player: Player;
  team?: Team | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function getTypeColor(type: Player["playerType"]) {
  switch (type) {
    case "Batsman":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "Bowler":
      return "bg-green-500/20 text-green-400 border-green-500/50";
    case "All-Rounder":
      return "bg-purple-500/20 text-purple-400 border-purple-500/50";
    case "Wicket-Keeper":
      return "bg-amber-500/20 text-amber-400 border-amber-500/50";
  }
}

function getTagColor(tag: Player["additionalTag"]) {
  switch (tag) {
    case "Captain":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "Vice Captain":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    case "Normal Player":
      return "bg-slate-500/20 text-slate-400 border-slate-500/50";
  }
}

export function PlayerCard({ player, team }: PlayerCardProps) {
  const isSold = player.status === "sold" && team;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className={cn(
          "overflow-hidden relative bg-card border border-white/5 shadow-xl transition-all duration-300",
          isSold ? "opacity-90" : "hover:border-primary/50"
        )}
        style={isSold ? { borderColor: team.color } : {}}
      >
        {isSold && (
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: team.color }}
          />
        )}
        <CardContent className="p-3 sm:p-4">
          {/* Top row: avatar + name + badges */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-full flex-shrink-0 flex items-center justify-center font-heading text-base sm:text-lg text-white"
              style={{
                background: isSold
                  ? `linear-gradient(135deg, ${team.color}40, ${team.color}10)`
                  : "linear-gradient(135deg, #1e293b, #0f172a)",
                border: `2px solid ${isSold ? team.color : "#334155"}`,
                width: "44px",
                height: "44px",
                minWidth: "44px",
              }}
            >
              {getInitials(player.name)}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-base sm:text-xl tracking-wide text-white uppercase leading-tight truncate">
                {player.name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>{player.age} yrs</span>
                <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                <span className="truncate">{player.village}</span>
              </p>
            </div>

            {/* Badges — stacked, shrink to fit */}
            <div className="flex flex-col gap-1 items-end flex-shrink-0 ml-1">
              <Badge
                variant="outline"
                className={cn(
                  "uppercase tracking-wide text-[9px] px-1.5 py-0 h-4 leading-none",
                  getTypeColor(player.playerType)
                )}
              >
                {player.playerType === "Wicket-Keeper" ? "WK" : player.playerType === "All-Rounder" ? "All-R" : player.playerType}
              </Badge>
              {player.additionalTag !== "Normal Player" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "uppercase tracking-wide text-[9px] px-1.5 py-0 h-4 leading-none",
                    getTagColor(player.additionalTag)
                  )}
                >
                  {player.additionalTag === "Vice Captain" ? "V.Capt" : player.additionalTag}
                </Badge>
              )}
            </div>
          </div>

          {/* Bottom row: status */}
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center">
            {isSold ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                  Sold
                </span>
                <span className="text-xs text-white/60">to</span>
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: team.color }}
                >
                  {team.name}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                Available
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
