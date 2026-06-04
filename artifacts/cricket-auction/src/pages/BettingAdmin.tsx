import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useBetting, bettingFetch, Match } from "@/context/BettingContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, RefreshCw, Trophy, IndianRupee, Users, Ticket, CheckCircle, XCircle, Star, Edit2, Trash2 } from "lucide-react";

type AdminTab = "transactions" | "users" | "matches" | "bets";

export default function BettingAdmin() {
  const { logout, isAdmin, loading } = useBetting();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("transactions");

  useEffect(() => {
    if (!loading && !isAdmin) setLocation("/");
  }, [isAdmin, loading, setLocation]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<any[]>([]);

  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [winnerModal, setWinnerModal] = useState<Match | null>(null);
  const [editBalanceUser, setEditBalanceUser] = useState<any | null>(null);
  const [approveTxn, setApproveTxn] = useState<any | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [t, u, m, b] = await Promise.all([
        bettingFetch("/betting/admin/transactions"),
        bettingFetch("/betting/admin/users"),
        bettingFetch("/betting/matches"),
        bettingFetch("/betting/admin/bets"),
      ]);
      setTransactions(t); setUsers(u); setMatches(m); setBets(b);
    } catch (err: any) { toast.error(err.message || "Failed to load data"); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const txnStatusColor = (s: string) => {
    if (s === "approved") return "text-green-400";
    if (s === "cancelled") return "text-red-400";
    return "text-yellow-400";
  };

  const statusBg = (s: string) => {
    if (s === "approved") return "bg-green-500/10 border-green-500/20";
    if (s === "cancelled") return "bg-red-500/10 border-red-500/20";
    return "bg-yellow-500/10 border-yellow-500/20";
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-3xl text-yellow-400 uppercase tracking-wider">Batting Admin</h1>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="text-white/30 hover:text-white"><RefreshCw className="w-5 h-5" /></button>
            <Button size="sm" variant="outline" onClick={logout} className="border-white/20 text-white/60 text-xs">Logout</Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pending Requests", val: transactions.filter(t => t.status === "pending").length, color: "text-yellow-400" },
            { label: "Total Users", val: users.length, color: "text-blue-400" },
            { label: "Total Matches", val: matches.length, color: "text-green-400" },
            { label: "Total Bets", val: bets.length, color: "text-purple-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className={`text-2xl font-heading ${s.color}`}>{s.val}</p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1 mb-6 overflow-x-auto">
          {(["transactions", "users", "matches", "bets"] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === tab ? "bg-yellow-400 text-black" : "text-white/50 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-white/40">No transactions yet</div>
            ) : transactions.map(txn => (
              <div key={txn.id} className={`border rounded-xl p-3 ${statusBg(txn.status)}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${txn.type === "add" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {txn.type === "add" ? "+ Add" : "- Withdraw"}
                      </span>
                      <span className={`text-xs font-bold ${txnStatusColor(txn.status)}`}>{txn.status}</span>
                      <span className="text-white/60 text-sm font-semibold">{txn.userName} ({txn.userEmail})</span>
                    </div>
                    <p className="text-xl font-heading text-white mt-1">₹{txn.amount}</p>
                    {txn.utrNo && <p className="text-white/40 text-xs">UTR: {txn.utrNo}</p>}
                    {txn.note && <p className="text-white/40 text-xs">Note: {txn.note}</p>}
                    {txn.imageUrl && <a href={txn.imageUrl} target="_blank" rel="noreferrer" className="text-yellow-400/70 text-xs underline">View Screenshot</a>}
                    <p className="text-white/30 text-xs">{new Date(txn.createdAt).toLocaleString()}</p>
                    {txn.adminNote && <p className="text-yellow-400/60 text-xs">Admin note: {txn.adminNote}</p>}
                  </div>
                  {txn.status === "pending" && (
                    <button onClick={() => setApproveTxn(txn)} className="shrink-0 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400/30 transition-colors">
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="text-center py-12 text-white/40">No users yet</div>
            ) : users.map(u => (
              <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{u.name}</p>
                  <p className="text-white/40 text-xs">{u.email}</p>
                  <p className="text-white/30 text-xs">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-yellow-400 font-heading text-xl">₹{u.balance}</p>
                    <p className="text-white/30 text-xs">Balance</p>
                  </div>
                  <button onClick={() => setEditBalanceUser(u)} className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MATCHES */}
        {activeTab === "matches" && (
          <div>
            <div className="flex justify-end mb-4">
              <Button size="sm" onClick={() => setCreateMatchOpen(true)} className="bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-300">
                <Plus className="w-4 h-4 mr-1" /> Create Match
              </Button>
            </div>
            <div className="space-y-2">
              {matches.length === 0 ? (
                <div className="text-center py-12 text-white/40">No matches yet</div>
              ) : matches.map(m => (
                <div key={m.id} className={`bg-white/5 border rounded-xl p-3 ${m.isSpecial ? "border-yellow-400/30" : "border-white/10"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      {m.isSpecial && <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold mb-1"><Star className="w-3 h-3 fill-yellow-400" /> SPECIAL</div>}
                      <p className="text-white font-semibold">{m.title}</p>
                      <p className="text-white/60 text-sm">{m.team1} vs {m.team2}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/30 text-xs">{new Date(m.matchDate).toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase ${
                          m.status === "upcoming" ? "text-blue-300 border-blue-400/30 bg-blue-400/10" :
                          m.status === "live" ? "text-green-300 border-green-400/30 bg-green-400/10" :
                          "text-white/40 border-white/10 bg-white/5"
                        }`}>{m.status}</span>
                      </div>
                      {m.winner && <p className="text-green-400 text-xs mt-1">Winner: {m.winner === "team1" ? m.team1 : m.winner === "team2" ? m.team2 : "Draw"}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {(m.status === "upcoming" || m.status === "live") && (
                        <button onClick={() => setWinnerModal(m)} className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs px-2 py-1 rounded-lg hover:bg-green-500/30">
                          <Trophy className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => setEditMatch(m)} className="bg-white/10 border border-white/20 text-white text-xs px-2 py-1 rounded-lg hover:bg-white/20">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={async () => { if (confirm("Delete this match?")) { try { await bettingFetch(`/betting/admin/matches/${m.id}`, { method: "DELETE" }); toast.success("Match deleted"); fetchAll(); } catch (e: any) { toast.error(e.message); } } }} className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-500/30">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BETS */}
        {activeTab === "bets" && (
          <div className="space-y-2">
            {bets.length === 0 ? (
              <div className="text-center py-12 text-white/40">No bets yet</div>
            ) : bets.map(b => {
              const teamName = b.betOn === "team1" ? b.matchTeam1 : b.matchTeam2;
              const statusStyle =
                b.status === "won" ? "bg-green-500/15 border-green-500/20" :
                b.status === "lost" ? "bg-red-500/10 border-red-500/15" :
                b.status === "refunded" ? "bg-blue-500/10 border-blue-500/15" :
                "bg-white/5 border-white/10";
              return (
                <div key={b.id} className={`border rounded-xl p-3 flex items-center justify-between gap-3 ${statusStyle}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{b.matchTitle}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-white/50 text-xs">{b.userName}</span>
                      <span className="text-white/20 text-xs">·</span>
                      <span className="text-white/40 text-xs">bet on</span>
                      <span className="text-white/80 text-xs font-bold">{teamName ?? b.betOn}</span>
                    </div>
                    <p className="text-white/25 text-xs">{new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-heading">₹{b.amount}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {b.status === "won" && <CheckCircle className="w-3 h-3 text-green-400" />}
                      {b.status === "lost" && <XCircle className="w-3 h-3 text-red-400" />}
                      <p className={`text-xs font-bold uppercase ${b.status === "won" ? "text-green-400" : b.status === "lost" ? "text-red-400" : b.status === "refunded" ? "text-blue-400" : "text-yellow-400"}`}>{b.status}</p>
                    </div>
                    {b.payout > 0 && <p className="text-green-400 text-xs">+₹{b.payout}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Create / Edit Match Modal */}
      <MatchFormModal
        open={createMatchOpen || !!editMatch}
        match={editMatch}
        onClose={() => { setCreateMatchOpen(false); setEditMatch(null); }}
        onSaved={() => { setCreateMatchOpen(false); setEditMatch(null); fetchAll(); }}
      />

      {/* Declare Winner Modal */}
      {winnerModal && (
        <WinnerModal
          match={winnerModal}
          onClose={() => setWinnerModal(null)}
          onDeclared={() => { setWinnerModal(null); fetchAll(); }}
        />
      )}

      {/* Edit Balance Modal */}
      {editBalanceUser && (
        <EditBalanceModal
          user={editBalanceUser}
          onClose={() => setEditBalanceUser(null)}
          onSaved={() => { setEditBalanceUser(null); fetchAll(); }}
        />
      )}

      {/* Approve/Reject Transaction Modal */}
      {approveTxn && (
        <ApproveTxnModal
          txn={approveTxn}
          onClose={() => setApproveTxn(null)}
          onSaved={() => { setApproveTxn(null); fetchAll(); }}
        />
      )}
    </div>
  );
}

function MatchFormModal({ open, match, onClose, onSaved }: { open: boolean; match: Match | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(match?.title || "");
  const [team1, setTeam1] = useState(match?.team1 || "");
  const [team2, setTeam2] = useState(match?.team2 || "");
  const [matchDate, setMatchDate] = useState(match?.matchDate ? match.matchDate.slice(0, 16) : "");
  const [isSpecial, setIsSpecial] = useState(match?.isSpecial || false);
  const [description, setDescription] = useState(match?.description || "");
  const [status, setStatus] = useState(match?.status || "upcoming");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match) {
      setTitle(match.title); setTeam1(match.team1); setTeam2(match.team2);
      setMatchDate(match.matchDate?.slice(0, 16) || "");
      setIsSpecial(match.isSpecial); setDescription(match.description); setStatus(match.status);
    } else {
      setTitle(""); setTeam1(""); setTeam2(""); setMatchDate(""); setIsSpecial(false); setDescription(""); setStatus("upcoming");
    }
  }, [match, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (match) {
        await bettingFetch(`/betting/admin/matches/${match.id}`, { method: "PUT", body: JSON.stringify({ title, team1, team2, matchDate: new Date(matchDate).toISOString(), isSpecial, description, status }) });
        toast.success("Match updated!");
      } else {
        await bettingFetch("/betting/admin/matches", { method: "POST", body: JSON.stringify({ title, team1, team2, matchDate: new Date(matchDate).toISOString(), isSpecial, description }) });
        toast.success("Match created!");
      }
      onSaved();
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm bg-[#0d1425] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-yellow-400 uppercase">{match ? "Edit Match" : "Create Match"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-black/30 border-white/10 text-white" required /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">Team 1</Label><Input value={team1} onChange={e => setTeam1(e.target.value)} className="bg-black/30 border-white/10 text-white" required /></div>
            <div><Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">Team 2</Label><Input value={team2} onChange={e => setTeam2(e.target.value)} className="bg-black/30 border-white/10 text-white" required /></div>
          </div>
          <div><Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">Match Date & Time</Label><Input type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="bg-black/30 border-white/10 text-white" required /></div>
          {match && (
            <div><Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">Status</Label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-black/30 border border-white/10 text-white rounded-md px-3 py-2 text-sm">
                <option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
          <div><Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} className="bg-black/30 border-white/10 text-white" /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="special" checked={isSpecial} onChange={e => setIsSpecial(e.target.checked)} className="w-4 h-4 accent-yellow-400" />
            <label htmlFor="special" className="text-white/70 text-sm">Special Match</label>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/20 text-white">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-yellow-400 text-black font-bold">{loading ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WinnerModal({ match, onClose, onDeclared }: { match: Match; onClose: () => void; onDeclared: () => void }) {
  const [winner, setWinner] = useState<"team1" | "team2" | "draw" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeclare = async () => {
    if (!winner) return;
    setLoading(true);
    try {
      const res = await bettingFetch(`/betting/admin/matches/${match.id}/winner`, { method: "POST", body: JSON.stringify({ winner }) });
      toast.success(`Result declared! ${res.settled} bets settled.`);
      onDeclared();
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm bg-[#0d1425] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-yellow-400 uppercase">Declare Match Result</DialogTitle>
        </DialogHeader>
        <p className="text-white/50 text-sm mb-1">{match.title}</p>
        <p className="text-white/80 text-sm font-semibold mb-4">{match.team1} <span className="text-white/30 font-normal">vs</span> {match.team2}</p>

        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-semibold">Select the winning team</p>
        <div className="space-y-2 mb-4">
          {/* Team 1 WIN */}
          <button
            onClick={() => setWinner("team1")}
            className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${winner === "team1" ? "border-green-500 bg-green-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}
          >
            <div className="text-left">
              <p className={`text-sm font-bold ${winner === "team1" ? "text-green-400" : "text-white/80"}`}>{match.team1}</p>
              <p className="text-white/30 text-xs">Bets on {match.team1} → WIN (2x payout)</p>
            </div>
            {winner === "team1" && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">WIN</span>
            )}
          </button>

          {/* Team 2 WIN */}
          <button
            onClick={() => setWinner("team2")}
            className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${winner === "team2" ? "border-green-500 bg-green-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}
          >
            <div className="text-left">
              <p className={`text-sm font-bold ${winner === "team2" ? "text-green-400" : "text-white/80"}`}>{match.team2}</p>
              <p className="text-white/30 text-xs">Bets on {match.team2} → WIN (2x payout)</p>
            </div>
            {winner === "team2" && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">WIN</span>
            )}
          </button>

          {/* Draw */}
          <button
            onClick={() => setWinner("draw")}
            className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${winner === "draw" ? "border-blue-500 bg-blue-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}
          >
            <div className="text-left">
              <p className={`text-sm font-bold ${winner === "draw" ? "text-blue-400" : "text-white/80"}`}>Draw / No Result</p>
              <p className="text-white/30 text-xs">All bets refunded</p>
            </div>
            {winner === "draw" && (
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">DRAW</span>
            )}
          </button>
        </div>

        {winner && winner !== "draw" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-xs space-y-1">
            <p className="text-white/60 font-semibold uppercase tracking-wide">Result Summary</p>
            <p className="text-green-400">✓ Bets on <strong>{winner === "team1" ? match.team1 : match.team2}</strong> → WIN (+2x)</p>
            <p className="text-red-400">✗ Bets on <strong>{winner === "team1" ? match.team2 : match.team1}</strong> → LOSE</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/20 text-white">Cancel</Button>
          <Button
            onClick={handleDeclare}
            disabled={loading || !winner}
            className={`flex-1 font-bold ${winner === "draw" ? "bg-blue-500 hover:bg-blue-400 text-white" : "bg-green-500 hover:bg-green-400 text-white"}`}
          >
            {loading ? "Declaring…" : "Declare Result"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditBalanceModal({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const [balance, setBalance] = useState(String(user.balance));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await bettingFetch(`/betting/admin/users/${user.id}/balance`, { method: "PUT", body: JSON.stringify({ balance: Number(balance) }) });
      toast.success("Balance updated!");
      onSaved();
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xs bg-[#0d1425] border-white/10 text-white">
        <DialogHeader><DialogTitle className="font-heading text-xl text-yellow-400 uppercase">Edit Balance</DialogTitle></DialogHeader>
        <p className="text-white/60 text-sm mb-3">{user.name} ({user.email})</p>
        <Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">New Balance (₹)</Label>
        <div className="relative mb-4">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} className="pl-9 bg-black/30 border-white/10 text-white" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/20 text-white">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-yellow-400 text-black font-bold">{loading ? "Saving…" : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApproveTxnModal({ txn, onClose, onSaved }: { txn: any; onClose: () => void; onSaved: () => void }) {
  const [adminNote, setAdminNote] = useState("");
  const [manualAmount, setManualAmount] = useState(String(txn.amount));
  const [loading, setLoading] = useState(false);

  const handle = async (status: "approved" | "cancelled") => {
    setLoading(true);
    try {
      await bettingFetch(`/betting/admin/transactions/${txn.id}`, { method: "PUT", body: JSON.stringify({ status, adminNote: adminNote.trim() || null, manualAmount: Number(manualAmount) }) });
      toast.success(status === "approved" ? "Transaction approved!" : "Transaction cancelled");
      onSaved();
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm bg-[#0d1425] border-white/10 text-white">
        <DialogHeader><DialogTitle className="font-heading text-xl text-yellow-400 uppercase">Review Transaction</DialogTitle></DialogHeader>
        <div className="bg-white/5 rounded-xl p-3 mb-3 space-y-1">
          <p className="text-white font-semibold">{txn.userName} ({txn.userEmail})</p>
          <p className="text-white/60 text-sm capitalize">{txn.type} request</p>
          {txn.utrNo && <p className="text-white/40 text-xs">UTR: {txn.utrNo}</p>}
          {txn.note && <p className="text-white/40 text-xs">Note: {txn.note}</p>}
          {txn.imageUrl && <a href={txn.imageUrl} target="_blank" rel="noreferrer" className="text-yellow-400/70 text-xs underline block">View Screenshot</a>}
        </div>
        {txn.type === "add" && (
          <div className="mb-3">
            <Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">Credit Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type="number" min="1" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="pl-9 bg-black/30 border-white/10 text-white" />
            </div>
          </div>
        )}
        <div className="mb-3">
          <Label className="text-white/60 text-xs uppercase tracking-wider mb-1 block">Admin Note (optional)</Label>
          <Input value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add a note…" className="bg-black/30 border-white/10 text-white" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/20 text-white">Cancel</Button>
          <Button onClick={() => handle("cancelled")} disabled={loading} variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10">Reject</Button>
          <Button onClick={() => handle("approved")} disabled={loading} className="flex-1 bg-green-500 text-white font-bold hover:bg-green-400">{loading ? "…" : "Approve"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
