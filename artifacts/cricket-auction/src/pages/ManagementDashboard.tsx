import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useData } from "@/context/DataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Plus, Edit2, Trash2, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerForm } from "@/components/PlayerForm";
import { TeamForm } from "@/components/TeamForm";
import { AssignPanel } from "@/components/AssignPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Player, Team } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";

export default function ManagementDashboard() {
  const { players, teams, deletePlayer, deleteTeam } = useData();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState("players");
  
  // Modals state
  const [playerFormOpen, setPlayerFormOpen] = useState(false);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);

  // Delete confirmations
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [deleteTeamPlayersAlso, setDeleteTeamPlayersAlso] = useState(false);

  const openAddPlayer = () => {
    setPlayerToEdit(null);
    setPlayerFormOpen(true);
  };

  const openEditPlayer = (player: Player) => {
    setPlayerToEdit(player);
    setPlayerFormOpen(true);
  };

  const openAddTeam = () => {
    setTeamToEdit(null);
    setTeamFormOpen(true);
  };

  const openEditTeam = (team: Team) => {
    setTeamToEdit(team);
    setTeamFormOpen(true);
  };

  const confirmDeletePlayer = () => {
    if (playerToDelete) {
      deletePlayer(playerToDelete);
      toast.success("Player deleted permanently");
      setPlayerToDelete(null);
    }
  };

  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete, deleteTeamPlayersAlso);
      toast.success(deleteTeamPlayersAlso ? "Team and its players deleted" : "Team deleted. Players returned to auction.");
      setTeamToDelete(null);
      setDeleteTeamPlayersAlso(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-foreground flex flex-col">
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-[#0f172a] shadow-lg shadow-black/50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <span className="font-heading text-2xl tracking-wide text-white uppercase mt-1">Management <span className="text-primary">Console</span></span>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary font-bold uppercase tracking-wider">
            Admin Mode Active
          </Badge>
        </div>
      </nav>

      <main className="flex-1 container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10 h-14 p-1 mb-8 w-full max-w-xl mx-auto flex">
            <TabsTrigger value="players" className="font-heading text-lg tracking-wide flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Players Master</TabsTrigger>
            <TabsTrigger value="teams" className="font-heading text-lg tracking-wide flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Franchises</TabsTrigger>
            <TabsTrigger value="assignments" className="font-heading text-lg tracking-wide flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Auction Room</TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="mt-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-heading uppercase tracking-wide text-white">Player Database</h2>
                <p className="text-muted-foreground text-sm">Manage all registered players in the system</p>
              </div>
              <Button onClick={openAddPlayer} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide">
                <Plus className="w-4 h-4 mr-2" /> Add Player
              </Button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/90">
                  <thead className="bg-black/40 border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4">Type / Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {players.map(player => (
                      <tr key={player.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold">{player.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{player.age} yrs • {player.village}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs border border-white/20 bg-white/5 px-2 py-0.5 rounded">{player.playerType}</span>
                            {player.additionalTag !== "Normal Player" && (
                              <span className="text-[10px] text-primary">{player.additionalTag}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {player.status === "available" ? (
                            <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider">Available</span>
                          ) : (
                            <span className="text-red-400 font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                              Sold <span className="text-white/50 lowercase">({teams.find(t=>t.id === player.teamId)?.name || "Unknown"})</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white" onClick={() => openEditPlayer(player)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-400/10" onClick={() => setPlayerToDelete(player.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {players.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No players found in database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-heading uppercase tracking-wide text-white">Franchises</h2>
                <p className="text-muted-foreground text-sm">Manage participating teams</p>
              </div>
              <Button onClick={openAddTeam} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide">
                <Plus className="w-4 h-4 mr-2" /> Add Team
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <div key={team.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col relative group">
                  <div className="h-2 w-full absolute top-0 left-0" style={{ backgroundColor: team.color }} />
                  <div className="p-6 flex-1 flex items-start gap-4">
                    <div className="w-16 h-16 rounded bg-black/40 border border-white/10 flex items-center justify-center p-2 flex-shrink-0">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                      ) : (
                        <Shield className="w-8 h-8 text-white/20" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading text-2xl text-white uppercase">{team.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{team.location}</p>
                      <span className="text-xs font-bold text-white/70 bg-black/40 px-2 py-1 rounded border border-white/5">
                        {players.filter(p => p.teamId === team.id).length} Players
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-white/10 bg-black/20 p-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 text-white/70 hover:text-white" onClick={() => openEditTeam(team)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-red-400/70 hover:text-red-400 hover:bg-red-400/10" onClick={() => setTeamToDelete(team.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-xl text-muted-foreground">
                  No franchises created.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="mt-0">
            <AssignPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Forms */}
      <PlayerForm open={playerFormOpen} onOpenChange={setPlayerFormOpen} playerToEdit={playerToEdit} />
      <TeamForm open={teamFormOpen} onOpenChange={setTeamFormOpen} teamToEdit={teamToEdit} />

      {/* Delete Player Dialog */}
      <AlertDialog open={!!playerToDelete} onOpenChange={(o) => !o && setPlayerToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Delete Player?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. The player will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white bg-transparent hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeletePlayer}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Dialog */}
      <AlertDialog open={!!teamToDelete} onOpenChange={(o) => !o && setTeamToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Delete Franchise?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This will remove the team from the system. What would you like to do with the players currently assigned to this team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="flex items-center space-x-2 bg-red-950/30 p-4 rounded-lg border border-red-900/50">
              <Checkbox 
                id="delete-players" 
                checked={deleteTeamPlayersAlso} 
                onCheckedChange={(c) => setDeleteTeamPlayersAlso(!!c)} 
                className="border-red-400 data-[state=checked]:bg-red-500"
              />
              <label htmlFor="delete-players" className="text-sm text-red-200 cursor-pointer">
                Also completely delete all players in this team from the database. (If unchecked, they will be returned to the available auction pool).
              </label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white bg-transparent hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeleteTeam}>Delete Franchise</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
