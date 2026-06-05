import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bettingFetch } from "@/context/BettingContext";
import { toast } from "sonner";
import { Upload, IndianRupee, Hash, Loader2, CheckCircle2 } from "lucide-react";

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
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Screenshot must be under 5MB"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?folder=transactions", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setImageUrl(url);
    } catch {
      toast.error("Failed to upload screenshot");
    } finally {
      setUploading(false);
    }
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
      setAmount(""); setUtrNo(""); setImageUrl(""); setStep("qr");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("qr"); setAmount(""); setUtrNo(""); setImageUrl("");
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
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <span className="text-green-400 text-lg leading-none mt-0.5">✓</span>
              <p className="text-green-300 text-xs leading-relaxed">Your amount will be deposited within 10 minutes, don't worry!</p>
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
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                    <span className="text-white/40 text-sm">Uploading…</span>
                  </div>
                ) : imageUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={imageUrl} alt="Screenshot" className="max-h-32 object-contain rounded" />
                    <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Uploaded</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-white/30 mb-2" />
                    <span className="text-white/40 text-sm">Click to upload screenshot</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("qr")} className="flex-1 border-white/20 text-white">
                Back
              </Button>
              <Button type="submit" disabled={loading || uploading} className="flex-1 bg-yellow-400 text-black font-bold hover:bg-yellow-300">
                {loading ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
