import { useData } from "@/context/DataContext";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Check, Star, AlertTriangle, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AssignPanel() {
  const { players, teams, assignPlayerToTeam, removePlayerFromTeam } = useData();
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [searchAvailable, setSearchAvailable] = useState("");

  const availablePlayers = players.filter(
    p => p.status === "available" && p.name.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  const handleAssign = async (playerId: string) => {
    const teamId = selectedTeams[playerId];
    if (!teamId) { toast.error("Please select a team first"); return; }
    const result = await assignPlayerToTeam(playerId, teamId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Player assigned to team!");
      const next = { ...selectedTeams };
      delete next[playerId];
      setSelectedTeams(next);
    }
  };

  const handleRemove = async (playerId: string) => {
    await removePlayerFromTeam(playerId);
    toast.success("Player returned to auction pool");
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── Points Summary Bar ───────────────────────────────── */}
      {teams.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <h2 className="font-heading text-xs text-white/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Team Points Overview
          </h2>
          <div className="space-y-2">
            {teams.map(team => {
              const remaining = team.totalPoints - team.usedPoints;
              const usedPct = team.totalPoints > 0 ? Math.round((team.usedPoints / team.totalPoints) * 100) : 0;
              const isLow = remaining < 20;
              return (
                <div key={team.id} className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-white/70 text-xs font-semibold w-28 truncate">{team.name}</span>
                  <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${usedPct}%`, backgroundColor: team.color }}
                    />
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${isLow ? "text-red-400" : "text-white/70"}`}>
                    {isLow && <AlertTriangle className="w-3 h-3 inline mr-0.5 text-red-400" />}
                    {remaining} / {team.totalPoints} left
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Auction Pool ─────────────────────────────────────── */}
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
              const selectedTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) : null;
              const availablePoints = selectedTeam ? selectedTeam.totalPoints - selectedTeam.usedPoints : null;
              const canAfford = availablePoints === null || availablePoints >= player.points;

              return (
                <div
                  key={player.id}
                  className={`border px-3 py-2 rounded-lg flex flex-wrap gap-2 items-center justify-between transition-colors ${
                    selectedTeamId
                      ? canAfford
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-red-500/5 border-red-500/30"
                      : "bg-black/30 border-white/5"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-sm text-white leading-tight">{player.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                      {player.playerType} · {player.age} yrs · {player.village}
                      <span className="inline-flex items-center gap-0.5 text-primary font-bold ml-1">
                        <Star className="w-2.5 h-2.5 fill-primary" />
                        {player.points} pts
                      </span>
                    </p>
                    {/* Points affordability hint */}
                    {selectedTeam && (
                      <p className={`text-[10px] font-semibold mt-0.5 ${canAfford ? "text-emerald-400" : "text-red-400"}`}>
                        {canAfford
                          ? `✓ ${selectedTeam.name} can afford — ${availablePoints} pts remaining after: ${availablePoints! - player.points} pts left`
                          : `✗ Not enough — need ${player.points} pts, ${selectedTeam.name} only has ${availablePoints} pts`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Select
                      value={selectedTeams[player.id] || ""}
                      onValueChange={(val) => setSelectedTeams(prev => ({ ...prev, [player.id]: val }))}
                    >
                      <SelectTrigger className="w-[150px] bg-black/40 border-white/10 h-7 text-xs">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => {
                          const avail = team.totalPoints - team.usedPoints;
                          const ok = avail >= player.points;
                          return (
                            <SelectItem key={team.id} value={team.id} disabled={!ok}>
                              <span className={ok ? "text-white" : "text-red-400"}>
                                {team.name}
                                <span className={`ml-1 text-[10px] ${ok ? "text-white/50" : "text-red-400"}`}>
                                  ({avail} pts{!ok ? " — can't afford" : ""})
                                </span>
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
                      title={!canAfford ? "Team cannot afford this player" : "Assign to team"}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Team Rosters ─────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <h2 className="font-heading text-base text-white uppercase tracking-wide mb-3">Team Rosters</h2>
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">No teams created yet.</div>
        ) : (
          <div className="space-y-3">
            {teams.map(team => {
              const roster = players.filter(p => p.teamId === team.id);
              const remaining = team.totalPoints - team.usedPoints;
              const usedPct = team.totalPoints > 0 ? Math.round((team.usedPoints / team.totalPoints) * 100) : 0;
              const isLow = remaining < 20;
              return (
                <div key={team.id} className="border border-white/10 rounded-lg overflow-hidden">
                  {/* Team header */}
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
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${usedPct}%`, backgroundColor: team.color }}
                        />
                      </div>
                      <span className={`text-[9px] font-bold whitespace-nowrap ${isLow ? "text-red-400" : "text-white/50"}`}>
                        {isLow && "⚠ "}
                        <span className="text-white/90">{remaining}</span> / {team.totalPoints} pts left
                      </span>
                    </div>

                    {/* Points breakdown pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] bg-black/30 rounded px-1.5 py-0.5 text-white/40">
                        Total: <span className="text-white/70 font-bold">{team.totalPoints}</span>
                      </span>
                      <span className="text-[9px] bg-black/30 rounded px-1.5 py-0.5 text-white/40">
                        Used: <span className="text-yellow-400 font-bold">{team.usedPoints}</span>
                      </span>
                      <span className={`text-[9px] rounded px-1.5 py-0.5 ${isLow ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"} font-bold`}>
                        Remaining: {remaining}
                      </span>
                    </div>
                  </div>

                  {/* Player list */}
                  <div className="p-2 bg-black/20 space-y-1">
                    {roster.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Squad is empty</p>
                    ) : (
                      roster.map(player => (
                        <div key={player.id} className="flex items-center justify-between bg-black/40 border border-white/5 px-2 py-1.5 rounded">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-white truncate">{player.name}</span>
                            <span className="text-[9px] uppercase text-muted-foreground whitespace-nowrap hidden sm:inline">{player.playerType}</span>
                            {player.additionalTag !== "Normal Player" && (
                              <span className="text-[9px] bg-primary/20 text-primary px-1 rounded font-bold hidden sm:inline">{player.additionalTag}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-primary" />{player.points}
                            </span>
                            <button
                              onClick={() => handleRemove(player.id)}
                              className="text-red-400/70 hover:text-red-300 p-1 hover:bg-red-400/10 rounded transition-colors"
                              title="Return to Auction Pool"
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
