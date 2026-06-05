import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bettingFetch, Match } from "@/context/BettingContext";
import { toast } from "sonner";
import { Zap, IndianRupee, Star } from "lucide-react";

interface Props {
  open: boolean;
  match: Match;
  onClose: () => void;
  onSuccess: () => void;
  balance: number;
}

function getDefaultMultiplier(teamCount: number): number {
  if (teamCount <= 2) return 1.9;
  if (teamCount === 3) return 2.8;
  return teamCount + 0.8;
}

export function PlaceBetModal({ open, match, onClose, onSuccess, balance }: Props) {
  const [betOn, setBetOn] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const isSpecialMulti = match.isSpecial && match.teams && match.teams.length > 0;
  const teams: Array<{ key: string; label: string }> = isSpecialMulti
    ? match.teams!.map(t => ({ key: t, label: t }))
    : [
        { key: "team1", label: match.team1 },
        { key: "team2", label: match.team2 },
      ];
  const teamCount = isSpecialMulti ? match.teams!.length : 2;

  const getTeamMultiplier = (key: string): number =>
    match.teamPayouts?.[key] ?? getDefaultMultiplier(teamCount);

  const selectedMultiplier = betOn ? getTeamMultiplier(betOn) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!betOn) { toast.error("Select a team to bet on"); return; }
    const amt = Number(amount);
    if (!amt || amt < 10) { toast.error("Minimum bet is ₹10"); return; }
    if (amt > balance) { toast.error("Insufficient balance"); return; }
    setLoading(true);
    try {
      await bettingFetch("/betting/bets", {
        method: "POST",
        body: JSON.stringify({ matchId: match.id, betOn, amount: amt }),
      });
      const label = teams.find(t => t.key === betOn)?.label ?? betOn;
      toast.success(`Bet placed on ${label}!`);
      setBetOn(null); setAmount("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setBetOn(null); setAmount(""); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm bg-[#0d1425] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-wide uppercase text-center text-yellow-400 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" /> Place Bet
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
          {match.isSpecial && (
            <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold mb-1">
              <Star className="w-3 h-3 fill-yellow-400" /> SPECIAL MATCH
            </div>
          )}
          <p className="font-heading text-white text-lg">{match.title}</p>
          <p className="text-white/50 text-sm">{new Date(match.matchDate).toLocaleString()}</p>
        </div>

        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 text-center mb-4">
          <p className="text-white/50 text-xs">Available Balance</p>
          <p className="text-xl font-heading text-yellow-400">₹{balance.toLocaleString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white/70 text-xs uppercase tracking-wider mb-2 block">Choose a Team</Label>
            <div className={`grid gap-2 ${teams.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {teams.map(team => {
                const mult = getTeamMultiplier(team.key);
                return (
                  <button
                    key={team.key}
                    type="button"
                    onClick={() => setBetOn(team.key)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-left ${betOn === team.key ? "border-yellow-400 bg-yellow-400/20 text-yellow-400" : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"}`}
                  >
                    <p>{team.label}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${betOn === team.key ? "text-yellow-300" : "text-white/40"}`}>
                      Win: {mult}x
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">Bet Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="number"
                min="10"
                max={balance}
                placeholder="Min ₹10"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-9 bg-black/30 border-white/10 text-white focus-visible:ring-yellow-400"
                required
              />
            </div>
            {amount && Number(amount) >= 10 && selectedMultiplier && (
              <p className="text-white/40 text-xs mt-1">
                Potential win: ₹{Math.round(Number(amount) * selectedMultiplier).toLocaleString()} ({selectedMultiplier}x)
              </p>
            )}
            <p className="text-white/30 text-xs mt-1">⚠️ Bets cannot be cancelled once placed</p>
          </div>

          <Button
            type="submit"
            disabled={loading || !betOn}
            className="w-full bg-yellow-400 text-black font-bold hover:bg-yellow-300"
          >
            {loading ? "Placing Bet…" : `Bet on ${betOn ? (teams.find(t => t.key === betOn)?.label ?? betOn) : "…"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
