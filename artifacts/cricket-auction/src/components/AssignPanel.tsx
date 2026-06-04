import { useData } from "@/context/DataContext";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Check, Star } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AssignPanel() {
  const { players, teams, assignPlayerToTeam, removePlayerFromTeam } = useData();
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [searchAvailable, setSearchAvailable] = useState("");

  const availablePlayers = players.filter(p => p.status === "available" && p.name.toLowerCase().includes(searchAvailable.toLowerCase()));

  const handleAssign = async (playerId: string) => {
    const teamId = selectedTeams[playerId];
    if (!teamId) { toast.error("Please select a team first"); return; }
    const result = await assignPlayerToTeam(playerId, teamId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Player assigned to team");
      const next = { ...selectedTeams };
      delete next[playerId];
      setSelectedTeams(next);
    }
  };

  const handleRemove = async (playerId: string) => {
    await removePlayerFromTeam(playerId);
    toast.success("Player returned to auction pool");
  };

  const getTeamAvailablePoints = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return 0;
    return team.totalPoints - team.usedPoints;
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
            availablePlayers.map(player => {
              const selectedTeamId = selectedTeams[player.id];
              const availablePoints = selectedTeamId ? getTeamAvailablePoints(selectedTeamId) : null;
              const canAfford = availablePoints === null || availablePoints >= player.points;

              return (
                <div key={player.id} className="bg-black/30 border border-white/5 px-3 py-2 rounded-lg flex flex-wrap gap-2 items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-heading text-sm text-white leading-tight">{player.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {player.playerType} · {player.age} yrs
                      <span className="ml-1 inline-flex items-center gap-0.5 text-primary font-bold">
                        <Star className="w-2.5 h-2.5 fill-primary" />
                        {player.points} pts
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    {selectedTeamId && (
                      <p className={`text-[10px] text-center font-semibold ${canAfford ? "text-emerald-400" : "text-red-400"}`}>
                        {canAfford
                          ? `Available: ${availablePoints} pts ✓`
                          : `Need ${player.points} pts, have ${availablePoints}`}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={selectedTeams[player.id] || ""}
                        onValueChange={(val) => setSelectedTeams(prev => ({ ...prev, [player.id]: val }))}
                      >
                        <SelectTrigger className="flex-1 sm:w-[150px] bg-black/40 border-white/10 h-7 text-xs">
                          <SelectValue placeholder="Select Team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map(team => {
                            const avail = team.totalPoints - team.usedPoints;
                            const ok = avail >= player.points;
                            return (
                              <SelectItem key={team.id} value={team.id}>
                                <span className={ok ? "text-white" : "text-red-400"}>
                                  {team.name} ({avail} pts)
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 w-7 p-0 shrink-0 disabled:opacity-40"
                        onClick={() => handleAssign(player.id)}
                        disabled={!selectedTeams[player.id] || !canAfford}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Team Rosters with Points */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <h2 className="font-heading text-base text-white uppercase tracking-wide mb-3">Team Rosters</h2>
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">No teams created yet.</div>
        ) : (
          <div className="space-y-3">
            {teams.map(team => {
              const roster = players.filter(p => p.teamId === team.id);
              const available = team.totalPoints - team.usedPoints;
              const usedPct = team.totalPoints > 0 ? Math.round((team.usedPoints / team.totalPoints) * 100) : 0;
              return (
                <div key={team.id} className="border border-white/10 rounded-lg overflow-hidden">
                  <div className="px-3 py-2" style={{ backgroundColor: `${team.color}15`, borderBottom: `1px solid ${team.color}30` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-heading text-sm text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: team.color }} />
                        {team.name}
                      </h3>
                      <span className="text-[10px] font-bold text-white/60 bg-black/20 px-1.5 py-0.5 rounded">
                        {roster.length} players
                      </span>
                    </div>
                    {/* Points bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${usedPct}%`, backgroundColor: team.color }}
                        />
                      </div>
                      <span className="text-[9px] text-white/50 whitespace-nowrap">
                        <span className="text-white/80 font-bold">{available}</span> / {team.totalPoints} pts left
                      </span>
                    </div>
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
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-primary" />{player.points}
                            </span>
                            <button
                              onClick={() => handleRemove(player.id)}
                              className="text-red-400/70 hover:text-red-300 p-1 hover:bg-red-400/10 rounded transition-colors"
                              title="Return to Auction"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
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
