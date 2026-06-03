import { useData } from "@/context/DataContext";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AssignPanel() {
  const { players, teams, assignPlayerToTeam, removePlayerFromTeam } = useData();
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [searchAvailable, setSearchAvailable] = useState("");

  const availablePlayers = players.filter(p => p.status === "available" && p.name.toLowerCase().includes(searchAvailable.toLowerCase()));
  
  const handleAssign = (playerId: string) => {
    const teamId = selectedTeams[playerId];
    if (!teamId) {
      toast.error("Please select a team first");
      return;
    }
    
    assignPlayerToTeam(playerId, teamId);
    toast.success("Player assigned to team successfully");
    
    // Clear selection
    const next = { ...selectedTeams };
    delete next[playerId];
    setSelectedTeams(next);
  };

  const handleRemove = (playerId: string) => {
    removePlayerFromTeam(playerId);
    toast.success("Player returned to auction pool");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel: Available Players */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col h-[700px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl text-white uppercase tracking-wide flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            Auction Pool
          </h2>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-bold">
            {availablePlayers.length} Available
          </span>
        </div>
        
        <Input 
          placeholder="Search available players..." 
          className="bg-black/20 border-white/10 mb-4"
          value={searchAvailable}
          onChange={(e) => setSearchAvailable(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {availablePlayers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No available players match your search.
            </div>
          ) : (
            availablePlayers.map(player => (
              <div key={player.id} className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h3 className="font-heading text-xl text-white">{player.name}</h3>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span>{player.playerType}</span>
                    <span>•</span>
                    <span>{player.age} yrs</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select 
                    value={selectedTeams[player.id] || ""} 
                    onValueChange={(val) => setSelectedTeams(prev => ({ ...prev, [player.id]: val }))}
                  >
                    <SelectTrigger className="w-full sm:w-[160px] bg-black/40 border-white/10 h-9">
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
                    className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-3 shrink-0"
                    onClick={() => handleAssign(player.id)}
                    disabled={!selectedTeams[player.id]}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Teams & Rosters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col h-[700px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl text-white uppercase tracking-wide">
            Team Rosters
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {teams.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No teams created yet.
            </div>
          ) : (
            teams.map(team => {
              const roster = players.filter(p => p.teamId === team.id);
              
              return (
                <div key={team.id} className="border border-white/10 rounded-lg overflow-hidden">
                  <div 
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: `${team.color}15`, borderBottom: `1px solid ${team.color}30` }}
                  >
                    <h3 className="font-heading text-xl text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: team.color }} />
                      {team.name}
                    </h3>
                    <span className="text-xs font-bold text-white/70 bg-black/20 px-2 py-1 rounded">
                      {roster.length} Players
                    </span>
                  </div>
                  
                  <div className="p-4 bg-black/20 space-y-2">
                    {roster.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Squad is empty</p>
                    ) : (
                      roster.map(player => (
                        <div key={player.id} className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-white">{player.name}</span>
                            <span className="text-[10px] uppercase text-muted-foreground">{player.playerType}</span>
                          </div>
                          <button 
                            onClick={() => handleRemove(player.id)}
                            className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded transition-colors"
                            title="Return to Auction"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
