import { Team } from "@/context/DataContext";
import { Card, CardContent } from "@/components/ui/card";
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
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
    >
      <Card className="overflow-hidden relative bg-card border-white/5 hover:border-white/10 transition-colors shadow-2xl h-full group">
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
          style={{ background: `linear-gradient(45deg, transparent, ${team.color})` }}
        />
        <div 
          className="h-2 w-full"
          style={{ backgroundColor: team.color }}
        />
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div 
              className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center p-2 shadow-inner"
              style={{ backgroundColor: `${team.color}15`, border: `1px solid ${team.color}30` }}
            >
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center font-heading text-xl text-white/50">LOGO</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-3xl tracking-wide text-white uppercase truncate mb-1">
                {team.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {team.description || "No description provided."}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-white/60">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="truncate">{team.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{playerCount} Players</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
