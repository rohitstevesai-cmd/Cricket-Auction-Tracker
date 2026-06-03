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
      whileHover={{ y: -4, scale: 1.02 }}
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
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center font-heading text-2xl text-white shadow-inner"
                style={{
                  background: isSold ? `linear-gradient(135deg, ${team.color}40, ${team.color}10)` : "linear-gradient(135deg, #1e293b, #0f172a)",
                  border: `2px solid ${isSold ? team.color : '#334155'}`
                }}
              >
                {getInitials(player.name)}
              </div>
              <div>
                <h3 className="font-heading text-2xl tracking-wide text-white uppercase">{player.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{player.age} yrs</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{player.village}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant="outline" className={cn("whitespace-nowrap uppercase tracking-wider text-[10px]", getTypeColor(player.playerType))}>
                {player.playerType}
              </Badge>
              {player.additionalTag !== "Normal Player" && (
                <Badge variant="outline" className={cn("whitespace-nowrap uppercase tracking-wider text-[10px]", getTagColor(player.additionalTag))}>
                  {player.additionalTag}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            {isSold ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Sold</span>
                <span className="text-sm text-white/80">to</span>
                <span className="text-sm font-bold" style={{ color: team.color }}>{team.name}</span>
              </div>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Available
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
