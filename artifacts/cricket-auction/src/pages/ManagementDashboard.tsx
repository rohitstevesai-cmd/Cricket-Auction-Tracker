import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Footer } from "@/components/Footer";
import { useData } from "@/context/DataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Plus, Edit2, Trash2, Settings, ArrowLeft, Star, Zap, CalendarDays, CheckCircle2, Trophy } from "lucide-react";
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
import { useMatches } from "@/hooks/useMatches";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManagementDashboard() {
  const { players, teams, deletePlayer, deleteTeam } = useData();
  const [, setLocation] = useLocation();
  const { matches, createMatch, updateMatch, deleteMatch } = useMatches();

  const [activeTab, setActiveTab] = useState("players");

  // Match form state
  const [matchFormOpen, setMatchFormOpen] = useState(false);
  const [matchTeam1, setMatchTeam1] = useState("");
  const [matchTeam2, setMatchTeam2] = useState("");
  const [matchVenue, setMatchVenue] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchOvers, setMatchOvers] = useState("20");
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const [savingMatch, setSavingMatch] = useState(false);

  const handleCreateMatch = async () => {
    if (!matchTeam1 || !matchTeam2 || matchTeam1 === matchTeam2) {
      toast.error("Select two different teams"); return;
    }
    setSavingMatch(true);
    try {
      await createMatch({ team1Id: matchTeam1, team2Id: matchTeam2, venue: matchVenue, matchDate, overs: parseInt(matchOvers) || 20 });
      toast.success("Match scheduled!");
      setMatchTeam1(""); setMatchTeam2(""); setMatchVenue(""); setMatchDate("");
      setMatchFormOpen(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingMatch(false); }
  };

  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;
    try { await deleteMatch(matchToDelete); toast.success("Match deleted"); setMatchToDelete(null); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await updateMatch(id, { status: status as any }); toast.success(`Status → ${status}`); }
    catch (e: any) { toast.error(e.message); }
  };
  
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

  const confirmDeletePlayer = async () => {
    if (playerToDelete) {
      await deletePlayer(playerToDelete);
      toast.success("Player deleted permanently");
      setPlayerToDelete(null);
    }
  };

  const confirmDeleteTeam = async () => {
    if (teamToDelete) {
      await deleteTeam(teamToDelete, deleteTeamPlayersAlso);
      toast.success(deleteTeamPlayersAlso ? "Team and its players deleted" : "Team deleted. Players returned to auction.");
      setTeamToDelete(null);
      setDeleteTeamPlayersAlso(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-foreground flex flex-col overflow-x-hidden">
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-[#0f172a] shadow-lg shadow-black/50">
        <div className="w-full px-4 sm:px-6 flex h-14 items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="text-muted-foreground hover:text-white transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-1.5 min-w-0">
              <Settings className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-heading text-sm sm:text-xl tracking-wide text-white uppercase">
                <span className="sm:hidden">MGMT <span className="text-primary">CON.</span></span>
                <span className="hidden sm:inline">Management <span className="text-primary">Console</span></span>
              </span>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary font-bold uppercase tracking-wider text-[9px] sm:text-xs px-2 py-0.5 flex-shrink-0 whitespace-nowrap">
            Admin Active
          </Badge>
        </div>
      </nav>

      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-5xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10 h-10 p-0.5 mb-5 w-full flex">
            <TabsTrigger value="players" className="font-heading text-[11px] sm:text-sm tracking-wide flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="sm:hidden">Players</span>
              <span className="hidden sm:inline">Players Master</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="font-heading text-[11px] sm:text-sm tracking-wide flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Franchises</TabsTrigger>
            <TabsTrigger value="assignments" className="font-heading text-[11px] sm:text-sm tracking-wide flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="sm:hidden">Auction</span>
              <span className="hidden sm:inline">Auction Room</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="font-heading text-[11px] sm:text-sm tracking-wide flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1 justify-center">
              <Zap className="w-3 h-3 flex-shrink-0" />
              <span className="sm:hidden">Match</span>
              <span className="hidden sm:inline">Matches</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-heading uppercase tracking-wide text-white leading-tight">Player Database</h2>
                <p className="text-muted-foreground text-xs mt-0.5 hidden sm:block">Manage all registered players in the system</p>
              </div>
              <Button onClick={openAddPlayer} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide text-xs h-8 px-3">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Player
              </Button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                <table className="text-left text-xs text-white/90" style={{ minWidth: 480 }}>
                  <thead className="bg-black/40 border-b border-white/10 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3 py-2 whitespace-nowrap">Player</th>
                      <th className="px-3 py-2 whitespace-nowrap">Age / City</th>
                      <th className="px-3 py-2 whitespace-nowrap">Type</th>
                      <th className="px-3 py-2 whitespace-nowrap">Role</th>
                      <th className="px-3 py-2 whitespace-nowrap">Pts</th>
                      <th className="px-3 py-2 whitespace-nowrap">Status</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Act.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {players.map(player => (
                      <tr key={player.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-heading text-[10px] text-white"
                              style={{
                                background: player.photo ? "transparent" : "linear-gradient(135deg,#1e293b,#0f172a)",
                                border: "1.5px solid rgba(255,255,255,0.1)",
                                minWidth: 28,
                              }}
                            >
                              {player.photo ? (
                                <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                player.name.split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase()
                              )}
                            </div>
                            <span className="font-bold text-xs whitespace-nowrap">{player.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{player.age}y · {player.village}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-[10px] border border-white/20 bg-white/5 px-1.5 py-0.5 rounded">{player.playerType}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {player.additionalTag !== "Normal Player" ? (
                            <span className="text-[10px] text-primary">{player.additionalTag}</span>
                          ) : (
                            <span className="text-[10px] text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="flex items-center gap-0.5 text-primary font-bold text-[10px]">
                            <Star className="w-2.5 h-2.5 fill-primary" />{player.points ?? 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {player.status === "available" ? (
                            <span className="text-emerald-400 font-semibold text-[10px] uppercase">Avail.</span>
                          ) : (
                            <span className="text-red-400 font-semibold text-[10px]">Sold</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white" onClick={() => openEditPlayer(player)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400/70 hover:text-red-400 hover:bg-red-400/10" onClick={() => setPlayerToDelete(player.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {players.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs">No players found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-heading uppercase tracking-wide text-white leading-tight">Franchises</h2>
                <p className="text-muted-foreground text-xs mt-0.5 hidden sm:block">Manage participating teams</p>
              </div>
              <Button onClick={openAddTeam} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide text-xs h-8 px-3">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Team
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map(team => (
                <div key={team.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col relative">
                  <div className="h-1 w-full absolute top-0 left-0" style={{ backgroundColor: team.color }} />
                  <div className="pt-3 pb-2 px-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-black/40 border border-white/10 flex items-center justify-center p-1.5 flex-shrink-0">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                      ) : (
                        <Shield className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-base text-white uppercase leading-tight truncate">{team.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{team.location} · <span className="text-white/60 font-semibold">{players.filter(p => p.teamId === team.id).length} players</span></p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3 h-3 fill-primary text-primary flex-shrink-0" />
                        <span className="text-[10px] text-white/50">{team.totalPoints - team.usedPoints} / {team.totalPoints} pts left</span>
                        <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${team.totalPoints > 0 ? Math.round((team.usedPoints / team.totalPoints) * 100) : 0}%`, backgroundColor: team.color }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={() => openEditTeam(team)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/50 hover:text-red-400 hover:bg-red-400/10" onClick={() => setTeamToDelete(team.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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

          <TabsContent value="matches" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-heading uppercase tracking-wide text-white leading-tight">Match Schedule</h2>
                <p className="text-muted-foreground text-xs mt-0.5 hidden sm:block">Create and manage SPL matches</p>
              </div>
              <Button onClick={() => setMatchFormOpen(v => !v)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide text-xs h-8 px-3">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Match
              </Button>
            </div>

            {/* Create Match Form */}
            {matchFormOpen && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
                <h3 className="font-heading text-sm text-white uppercase tracking-wide">Schedule New Match</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Team 1 (Batting first)</label>
                    <Select value={matchTeam1} onValueChange={setMatchTeam1}>
                      <SelectTrigger className="bg-black/30 border-white/10 h-8 text-xs"><SelectValue placeholder="Select team" /></SelectTrigger>
                      <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Team 2</label>
                    <Select value={matchTeam2} onValueChange={setMatchTeam2}>
                      <SelectTrigger className="bg-black/30 border-white/10 h-8 text-xs"><SelectValue placeholder="Select team" /></SelectTrigger>
                      <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Venue</label>
                    <Input value={matchVenue} onChange={e => setMatchVenue(e.target.value)} placeholder="e.g. Main Ground" className="bg-black/30 border-white/10 h-8 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Overs</label>
                    <Input value={matchOvers} onChange={e => setMatchOvers(e.target.value)} type="number" min={1} max={50} className="bg-black/30 border-white/10 h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Date & Time</label>
                  <Input value={matchDate} onChange={e => setMatchDate(e.target.value)} type="datetime-local" className="bg-black/30 border-white/10 h-8 text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-white/10 text-white/60 h-8" onClick={() => setMatchFormOpen(false)}>Cancel</Button>
                  <Button size="sm" className="bg-primary h-8 font-bold" disabled={savingMatch} onClick={handleCreateMatch}>
                    {savingMatch ? "Saving..." : "Schedule Match"}
                  </Button>
                </div>
              </div>
            )}

            {/* Matches list */}
            <div className="space-y-2">
              {matches.length === 0 && (
                <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-xl text-muted-foreground text-sm">No matches yet.</div>
              )}
              {matches.map(m => {
                const t1 = teams.find(t => t.id === m.team1Id);
                const t2 = teams.find(t => t.id === m.team2Id);
                const inn = (m as any).innings ?? [];
                const inn1 = inn.find((i: any) => i.inningsNumber === 1);
                const inn2 = inn.find((i: any) => i.inningsNumber === 2);
                return (
                  <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading text-sm text-white">{t1?.name ?? "?"} <span className="text-white/30">vs</span> {t2?.name ?? "?"}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            m.status === "ongoing" ? "bg-red-500/20 border-red-500/30 text-red-400" :
                            m.status === "completed" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                            "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                          }`}>{m.status}</span>
                        </div>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {m.venue || "SPL"} · {m.overs} ov
                          {m.matchDate && ` · ${new Date(m.matchDate).toLocaleString()}`}
                          {inn1 && ` · ${inn1.totalRuns}/${inn1.totalWickets}`}
                          {inn2 && ` vs ${inn2.totalRuns}/${inn2.totalWickets}`}
                          {m.winner && ` · 🏆 ${m.winner.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Status controls */}
                        {m.status === "upcoming" && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                            onClick={() => handleStatusChange(m.id, "ongoing")}>
                            Go Live
                          </Button>
                        )}
                        {m.status === "ongoing" && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                            onClick={() => handleStatusChange(m.id, "completed")}>
                            End
                          </Button>
                        )}
                        <Link href={`/match/${m.id}`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-400 hover:bg-blue-400/10">View</Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => setMatchToDelete(m.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

      {/* Delete Match Dialog */}
      <AlertDialog open={!!matchToDelete} onOpenChange={(o) => !o && setMatchToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Delete Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">This will permanently delete the match and all scoring data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white bg-transparent hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteMatch}>Delete</AlertDialogAction>
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
      <Footer />
    </div>
  );
}
