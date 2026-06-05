import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useBetting, bettingFetch, Match, Bet } from "@/context/BettingContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { AddMoneyModal } from "@/components/betting/AddMoneyModal";
import { WithdrawModal } from "@/components/betting/WithdrawModal";
import { PlaceBetModal } from "@/components/betting/PlaceBetModal";
import { toast } from "sonner";
import { Zap, Trophy, Clock, RefreshCw, IndianRupee, TrendingUp, Star, History, Ticket, CheckCircle, XCircle, MinusCircle, RotateCcw } from "lucide-react";

type Tab = "betting" | "profile";
type ProfileTab = "wallet" | "history";

function BetStatusBadge({ bet }: { bet: Bet }) {
  const teamBetOn = bet.betOn === "team1" ? bet.matchTeam1 : bet.betOn === "team2" ? bet.matchTeam2 : bet.betOn;
  const matchWinner = bet.matchWinner;

  if (bet.status === "won") {
    return (
      <div className="text-right">
        <div className="flex items-center justify-end gap-1.5 bg-green-500/15 border border-green-500/30 rounded-lg px-2.5 py-1.5">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <span className="text-green-400 text-sm font-bold uppercase">WON</span>
        </div>
        {bet.payout > 0 && (
          <p className="text-green-400 text-xs font-semibold mt-1">+₹{bet.payout}</p>
        )}
      </div>
    );
  }
  if (bet.status === "lost") {
    const winnerName = matchWinner === "team1" ? bet.matchTeam1 : matchWinner === "team2" ? bet.matchTeam2 : null;
    return (
      <div className="text-right">
        <div className="flex items-center justify-end gap-1.5 bg-red-500/15 border border-red-500/30 rounded-lg px-2.5 py-1.5">
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-red-400 text-sm font-bold uppercase">LOST</span>
        </div>
        {winnerName && (
          <p className="text-white/30 text-xs mt-1">{winnerName} won</p>
        )}
      </div>
    );
  }
  if (bet.status === "refunded") {
    return (
      <div className="text-right">
        <div className="flex items-center justify-end gap-1.5 bg-blue-500/15 border border-blue-500/30 rounded-lg px-2.5 py-1.5">
          <RotateCcw className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-blue-400 text-sm font-bold uppercase">DRAW</span>
        </div>
        <p className="text-blue-400/70 text-xs mt-1">+₹{bet.amount} refunded</p>
      </div>
    );
  }
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1.5">
        <MinusCircle className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-yellow-400 text-sm font-bold uppercase">PENDING</span>
      </div>
      <p className="text-white/30 text-xs mt-1">Awaiting result</p>
    </div>
  );
}

export default function BettingDashboard() {
  const { user, loading, refreshUser } = useBetting();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("betting");

  useEffect(() => {
    if (!loading && !user) setLocation("/");
  }, [user, loading, setLocation]);
  const [profileTab, setProfileTab] = useState<ProfileTab>("wallet");
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [betModalMatch, setBetModalMatch] = useState<Match | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingBets, setLoadingBets] = useState(false);
  const [loadingTxns, setLoadingTxns] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const data = await bettingFetch("/betting/matches");
      setMatches(data);
    } catch { } finally { setLoadingMatches(false); }
  }, []);

  const fetchBets = useCallback(async () => {
    setLoadingBets(true);
    try {
      const data = await bettingFetch("/betting/bets");
      setMyBets(data);
    } catch { } finally { setLoadingBets(false); }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingTxns(true);
    try {
      const data = await bettingFetch("/betting/transactions");
      setTransactions(data);
    } catch { } finally { setLoadingTxns(false); }
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);
  useEffect(() => { if (activeTab === "betting") fetchBets(); }, [activeTab, fetchBets]);
  useEffect(() => { if (activeTab === "profile") { fetchTransactions(); refreshUser(); } }, [activeTab, fetchTransactions, refreshUser]);

  const upcomingMatches = matches.filter(m => m.status === "upcoming" || m.status === "live");
  const completedMatches = matches.filter(m => m.status === "completed" || m.status === "cancelled");

  const statusColor = (s: string) => {
    if (s === "upcoming") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (s === "live") return "bg-green-500/20 text-green-300 border-green-500/30 animate-pulse";
    if (s === "completed") return "bg-white/10 text-white/50 border-white/10";
    return "bg-red-500/20 text-red-300 border-red-500/30";
  };

  const txnStatusColor = (s: string) => {
    if (s === "approved") return "text-green-400";
    if (s === "cancelled") return "text-red-400";
    return "text-yellow-400";
  };

  const wonBets = myBets.filter(b => b.status === "won").length;
  const lostBets = myBets.filter(b => b.status === "lost").length;
  const totalPayout = myBets.filter(b => b.status === "won").reduce((s, b) => s + b.payout, 0);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-6">

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-400/5 border border-yellow-400/20 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-yellow-400/70 text-xs uppercase tracking-widest font-semibold">My Balance</p>
            <p className="text-4xl font-heading text-yellow-400 mt-1">₹{(user?.balance ?? 0).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAddMoneyOpen(true)} className="flex-1 sm:flex-none bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-300">
              + Add Money
            </Button>
            <Button size="sm" variant="outline" onClick={() => setWithdrawOpen(true)} className="flex-1 sm:flex-none border-yellow-400/30 text-yellow-400 text-xs hover:bg-yellow-400/10">
              Withdraw
            </Button>
          </div>
        </div>

        {/* Bet Stats Row */}
        {myBets.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-green-400 text-xl font-heading">{wonBets}</p>
              <p className="text-white/40 text-xs mt-0.5">Won</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-red-400 text-xl font-heading">{lostBets}</p>
              <p className="text-white/40 text-xs mt-0.5">Lost</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
              <p className="text-yellow-400 text-xl font-heading">₹{totalPayout}</p>
              <p className="text-white/40 text-xs mt-0.5">Total Won</p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab("betting")}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === "betting" ? "bg-yellow-400 text-black" : "text-white/60 hover:text-white"}`}
          >
            <Zap className="w-4 h-4" /> Online Betting
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === "profile" ? "bg-yellow-400 text-black" : "text-white/60 hover:text-white"}`}
          >
            <Trophy className="w-4 h-4" /> Profile
          </button>
        </div>

        {/* BETTING TAB */}
        {activeTab === "betting" && (
          <div>
            {/* Upcoming / Live */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl text-white uppercase tracking-wide">Upcoming Matches</h2>
              <button onClick={fetchMatches} className="text-white/30 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>

            {loadingMatches ? (
              <div className="text-center py-12 text-white/40">Loading matches…</div>
            ) : upcomingMatches.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5">
                <Zap className="w-10 h-10 text-yellow-400/30 mx-auto mb-3" />
                <p className="text-white/40">No upcoming matches. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {upcomingMatches.map(match => (
                  <div key={match.id} className={`bg-white/5 border rounded-xl p-4 ${match.isSpecial ? "border-yellow-400/30 bg-yellow-400/5" : "border-white/10"}`}>
                    {match.isSpecial && (
                      <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold mb-2">
                        <Star className="w-3 h-3 fill-yellow-400" /> SPECIAL MATCH
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-heading text-lg text-white tracking-wide">{match.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {(match.teams && match.teams.length > 2 ? match.teams : [match.team1, match.team2]).map((t, i, arr) => (
                            <span key={t} className="flex items-center gap-1">
                              <span className="text-white/80 text-sm font-semibold">{t}</span>
                              {i < arr.length - 1 && <span className="text-white/30 text-xs">·</span>}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-white/30" />
                          <span className="text-white/40 text-xs">{new Date(match.matchDate).toLocaleString()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold uppercase ${statusColor(match.status)}`}>{match.status}</span>
                        </div>
                        {match.description && <p className="text-white/40 text-xs mt-1">{match.description}</p>}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setBetModalMatch(match)}
                        className="bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-300 shrink-0"
                      >
                        Place Bet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* My Bets */}
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="font-heading text-xl text-white uppercase tracking-wide flex items-center gap-2">
                <Ticket className="w-5 h-5 text-yellow-400" /> My Bets
              </h2>
              <button onClick={fetchBets} className="text-white/30 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>

            {loadingBets ? (
              <div className="text-center py-8 text-white/40">Loading bets…</div>
            ) : myBets.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-white/40 text-sm">You haven't placed any bets yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myBets.map(bet => {
                  const teamBetOn = bet.betOn === "team1" ? bet.matchTeam1 : bet.betOn === "team2" ? bet.matchTeam2 : bet.betOn;
                  const isSettled = bet.status === "won" || bet.status === "lost" || bet.status === "refunded";
                  return (
                    <div
                      key={bet.id}
                      className={`border rounded-xl p-3 flex items-center justify-between gap-3 transition-colors ${
                        bet.status === "won" ? "bg-green-500/5 border-green-500/20" :
                        bet.status === "lost" ? "bg-red-500/5 border-red-500/15" :
                        bet.status === "refunded" ? "bg-blue-500/5 border-blue-500/15" :
                        "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{bet.matchTitle}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-white/40 text-xs">Bet on</span>
                          <span className="text-white/90 text-xs font-bold">{teamBetOn}</span>
                          <span className="text-white/25 text-xs">·</span>
                          <span className="text-white/60 text-xs font-semibold">₹{bet.amount}</span>
                        </div>
                        <p className="text-white/25 text-xs mt-0.5">{new Date(bet.createdAt).toLocaleString()}</p>
                      </div>
                      <BetStatusBadge bet={bet} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <>
                <h2 className="font-heading text-xl text-white uppercase tracking-wide mt-8 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-white/40" /> Past Matches
                </h2>
                <div className="space-y-2">
                  {completedMatches.map(match => (
                    <div key={match.id} className="bg-white/5 border border-white/10 rounded-xl p-3 opacity-70">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-sm font-semibold">{match.title}</p>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {(match.teams && match.teams.length > 2 ? match.teams : [match.team1, match.team2]).map((t, i, arr) => (
                              <span key={t} className="flex items-center gap-1">
                                <span className={`text-xs font-semibold ${match.winner === t || (t === match.team1 && match.winner === "team1") || (t === match.team2 && match.winner === "team2") ? "text-green-400" : "text-white/40"}`}>{t}</span>
                                {i < arr.length - 1 && <span className="text-white/20 text-xs">·</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                        {match.winner && (
                          <div className="text-right">
                            {match.winner === "draw" ? (
                              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg font-bold">DRAW</span>
                            ) : (
                              <div>
                                <p className="text-xs text-white/30">Winner</p>
                                <p className="text-green-400 text-sm font-bold flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  {match.winner === "team1" ? match.team1 : match.winner === "team2" ? match.team2 : match.winner}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-400/20 border border-yellow-400/30 rounded-full flex items-center justify-center">
                <span className="font-heading text-2xl text-yellow-400">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-heading text-xl text-white">{user?.name}</p>
                <p className="text-white/40 text-sm">{user?.email}</p>
              </div>
            </div>

            {/* Profile Sub-tabs */}
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 mb-6 w-fit">
              <button onClick={() => setProfileTab("wallet")} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${profileTab === "wallet" ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}>
                Wallet
              </button>
              <button onClick={() => setProfileTab("history")} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${profileTab === "history" ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}>
                History
              </button>
            </div>

            {profileTab === "wallet" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setAddMoneyOpen(true)} className="bg-green-500/10 border border-green-500/20 hover:border-green-500/40 rounded-xl p-5 text-left transition-colors group">
                    <IndianRupee className="w-7 h-7 text-green-400 mb-2" />
                    <p className="font-heading text-lg text-white">Add Money</p>
                    <p className="text-white/40 text-xs mt-1">Top up your wallet</p>
                  </button>
                  <button onClick={() => setWithdrawOpen(true)} className="bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-xl p-5 text-left transition-colors group">
                    <TrendingUp className="w-7 h-7 text-red-400 mb-2" />
                    <p className="font-heading text-lg text-white">Withdraw</p>
                    <p className="text-white/40 text-xs mt-1">Min ₹100</p>
                  </button>
                </div>
              </div>
            )}

            {profileTab === "history" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg text-white uppercase">Transaction History</h3>
                  <button onClick={fetchTransactions} className="text-white/30 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
                {loadingTxns ? (
                  <div className="text-center py-8 text-white/40">Loading…</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-white/40 text-sm">No transactions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(txn => (
                      <div key={txn.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${txn.type === "add" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {txn.type === "add" ? "+ Add" : "- Withdraw"}
                            </span>
                            <span className={`text-xs font-semibold ${txnStatusColor(txn.status)}`}>{txn.status}</span>
                          </div>
                          <p className="text-white/40 text-xs mt-1">{new Date(txn.createdAt).toLocaleString()}</p>
                          {txn.utrNo && <p className="text-white/30 text-xs">UTR: {txn.utrNo}</p>}
                          {txn.note && <p className="text-white/30 text-xs">Note: {txn.note}</p>}
                          {txn.adminNote && <p className="text-yellow-400/60 text-xs">Admin: {txn.adminNote}</p>}
                        </div>
                        <p className={`text-lg font-heading font-bold ${txn.type === "add" ? "text-green-400" : "text-red-400"}`}>
                          {txn.type === "add" ? "+" : "-"}₹{txn.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      <AddMoneyModal open={addMoneyOpen} onClose={() => setAddMoneyOpen(false)} onSuccess={() => { refreshUser(); fetchTransactions(); }} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} onSuccess={() => { refreshUser(); fetchTransactions(); }} balance={user?.balance ?? 0} />
      {betModalMatch && (
        <PlaceBetModal
          open={!!betModalMatch}
          match={betModalMatch}
          onClose={() => setBetModalMatch(null)}
          onSuccess={() => { refreshUser(); fetchBets(); }}
          balance={user?.balance ?? 0}
        />
      )}
    </div>
  );
}
