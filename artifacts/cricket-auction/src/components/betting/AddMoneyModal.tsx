import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bettingFetch } from "@/context/BettingContext";
import { toast } from "sonner";
import { Upload, IndianRupee, Hash, Image } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QR_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/320px-QR_code_for_mobile_English_Wikipedia.svg.png";

export function AddMoneyModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"qr" | "details">("qr");
  const [amount, setAmount] = useState("");
  const [utrNo, setUtrNo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (!utrNo.trim()) { toast.error("UTR number is required"); return; }
    if (!imageUrl) { toast.error("Payment screenshot is required"); return; }
    setLoading(true);
    try {
      await bettingFetch("/betting/transactions/add", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), utrNo: utrNo.trim(), imageUrl }),
      });
      toast.success("Add money request submitted! Awaiting approval.");
      setAmount(""); setUtrNo(""); setImageUrl(""); setImageFile(null); setStep("qr");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("qr"); setAmount(""); setUtrNo(""); setImageUrl(""); setImageFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm bg-[#0d1425] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-wide uppercase text-center text-yellow-400">
            Add Money
          </DialogTitle>
        </DialogHeader>

        {step === "qr" ? (
          <div className="text-center space-y-4">
            <p className="text-white/60 text-sm">Scan the QR code and make your payment</p>
            <div className="bg-white rounded-xl p-4 mx-auto w-fit">
              <img src={QR_IMAGE} alt="Payment QR" className="w-48 h-48 object-contain" />
            </div>
            <p className="text-white/40 text-xs">After payment, click Continue to submit your UTR</p>
            <Button onClick={() => setStep("details")} className="w-full bg-yellow-400 text-black font-bold hover:bg-yellow-300">
              I've Made the Payment →
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type="number" min="1" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} className="pl-9 bg-black/30 border-white/10 text-white focus-visible:ring-yellow-400" required />
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">UTR Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input placeholder="Enter UTR / Transaction ID" value={utrNo} onChange={e => setUtrNo(e.target.value)} className="pl-9 bg-black/30 border-white/10 text-white focus-visible:ring-yellow-400" required />
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">Payment Screenshot</Label>
              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-yellow-400/50 transition-colors">
                {imageUrl ? (
                  <img src={imageUrl} alt="Screenshot" className="max-h-32 object-contain rounded" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-white/30 mb-2" />
                    <span className="text-white/40 text-sm">Click to upload screenshot</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("qr")} className="flex-1 border-white/20 text-white">
                Back
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-yellow-400 text-black font-bold hover:bg-yellow-300">
                {loading ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
