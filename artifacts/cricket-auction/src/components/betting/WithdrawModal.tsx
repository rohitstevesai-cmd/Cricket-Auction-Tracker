import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bettingFetch, useBetting } from "@/context/BettingContext";
import { toast } from "sonner";
import { IndianRupee, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  balance: number;
}

export function WithdrawModal({ open, onClose, onSuccess, balance }: Props) {
  const { refreshUser } = useBetting();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error("Minimum withdrawal is ₹100"); return; }
    if (amt > balance) { toast.error("Insufficient balance"); return; }
    setLoading(true);
    try {
      await bettingFetch("/betting/transactions/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount: amt, note: note.trim() || null }),
      });
      toast.success("Withdrawal request submitted!");
      await refreshUser();
      setAmount(""); setNote("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm bg-[#0d1425] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-wide uppercase text-center text-yellow-400">
            Withdraw Money
          </DialogTitle>
        </DialogHeader>

        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 text-center mb-2">
          <p className="text-white/60 text-xs uppercase tracking-wider">Available Balance</p>
          <p className="text-2xl font-heading text-yellow-400 font-bold">₹{balance.toLocaleString()}</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2 mb-2">
          <span className="text-blue-400 text-lg leading-none mt-0.5">⏱</span>
          <p className="text-blue-300 text-xs leading-relaxed">Your amount will be credited within 10 minutes after approval.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="number"
                min="100"
                max={balance}
                placeholder="Min ₹100"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-9 bg-black/30 border-white/10 text-white focus-visible:ring-yellow-400"
                required
              />
            </div>
            <p className="text-white/30 text-xs mt-1">Minimum withdrawal: ₹100</p>
          </div>
          <div>
            <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">Note (optional)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-white/40" />
              <textarea
                placeholder="Add a note (bank account, UPI ID, etc.)"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-md text-white text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-yellow-400 placeholder:text-white/30"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading || balance < 100} className="w-full bg-yellow-400 text-black font-bold hover:bg-yellow-300">
            {loading ? "Submitting…" : "Request Withdrawal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
