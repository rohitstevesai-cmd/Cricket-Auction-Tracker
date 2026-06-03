import { useData } from "@/context/DataContext";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AssignPanel() {
  const { players, teams, assignPlayerToTeam, removePlayerFromTeam } = useData();
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [searchAvailable, setSearchAvailable] = useState("");

  const availablePlayers = players.filter(p => p.status === "available" && p.name.toLowerCase().includes(searchAvailable.toLowerCase()));

  const handleAssign = (playerId: string) => {
    const teamId = selectedTeams[playerId];
    if (!teamId) { toast.error("Please select a team first"); return; }
    assignPlayerToTeam(playerId, teamId);
    toast.success("Player assigned to team");
    const next = { ...selectedTeams };
    delete next[playerId];
    setSelectedTeams(next);
  };

  const handleRemove = (playerId: string) => {
    removePlayerFromTeam(playerId);
    toast.success("Player returned to auction pool");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Auction Pool */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base text-white uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Auction Pool
          </h2>
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
            {availablePlayers.length} Available
          </span>
        </div>

        <Input
          placeholder="Search available players..."
          className="bg-black/20 border-white/10 mb-3 h-8 text-xs"
          value={searchAvailable}
          onChange={(e) => setSearchAvailable(e.target.value)}
        />

        <div className="space-y-2">
          {availablePlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">No available players.</div>
          ) : (
            availablePlayers.map(player => (
              <div key={player.id} className="bg-black/30 border border-white/5 px-3 py-2 rounded-lg flex flex-wrap gap-2 items-center justify-between">
                <div className="min-w-0">
                  <p className="font-heading text-sm text-white leading-tight">{player.name}</p>
                  <p className="text-[10px] text-muted-foreground">{player.playerType} · {player.age} yrs</p>
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Select
                    value={selectedTeams[player.id] || ""}
                    onValueChange={(val) => setSelectedTeams(prev => ({ ...prev, [player.id]: val }))}
                  >
                    <SelectTrigger className="flex-1 sm:w-[140px] bg-black/40 border-white/10 h-7 text-xs">
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 w-7 p-0 shrink-0"
                    onClick={() => handleAssign(player.id)}
                    disabled={!selectedTeams[player.id]}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Team Rosters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <h2 className="font-heading text-base text-white uppercase tracking-wide mb-3">Team Rosters</h2>
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">No teams created yet.</div>
        ) : (
          <div className="space-y-3">
            {teams.map(team => {
              const roster = players.filter(p => p.teamId === team.id);
              return (
                <div key={team.id} className="border border-white/10 rounded-lg overflow-hidden">
                  <div
                    className="px-3 py-2 flex items-center justify-between"
                    style={{ backgroundColor: `${team.color}15`, borderBottom: `1px solid ${team.color}30` }}
                  >
                    <h3 className="font-heading text-sm text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: team.color }} />
                      {team.name}
                    </h3>
                    <span className="text-[10px] font-bold text-white/60 bg-black/20 px-1.5 py-0.5 rounded">
                      {roster.length} players
                    </span>
                  </div>
                  <div className="p-2 bg-black/20 space-y-1">
                    {roster.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Squad is empty</p>
                    ) : (
                      roster.map(player => (
                        <div key={player.id} className="flex items-center justify-between bg-black/40 border border-white/5 px-2 py-1.5 rounded">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-white truncate">{player.name}</span>
                            <span className="text-[9px] uppercase text-muted-foreground whitespace-nowrap hidden sm:inline">{player.playerType}</span>
                          </div>
                          <button
                            onClick={() => handleRemove(player.id)}
                            className="text-red-400/70 hover:text-red-300 p-1 hover:bg-red-400/10 rounded transition-colors flex-shrink-0"
                            title="Return to Auction"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
