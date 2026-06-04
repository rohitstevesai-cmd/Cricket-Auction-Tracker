import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBetting } from "@/context/BettingContext";
import { toast } from "sonner";
import { Zap, User, Mail, Lock } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BettingAuthModal({ open, onClose }: Props) {
  const { login, register } = useBetting();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await login(email, password);
        if (result.error) { toast.error(result.error); return; }
        toast.success("Welcome back!");
        onClose();
      } else {
        if (!name.trim()) { toast.error("Name is required"); return; }
        const result = await register(email, password, name);
        if (result.error) { toast.error(result.error); return; }
        toast.success("Account created!");
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm bg-[#0d1425] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-wide uppercase text-center flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400">Online Batting</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 mb-4">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${mode === "login" ? "bg-yellow-400 text-black" : "text-white/60 hover:text-white"}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${mode === "signup" ? "bg-yellow-400 text-black" : "text-white/60 hover:text-white"}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-9 bg-black/30 border-white/10 text-white focus-visible:ring-yellow-400"
                  required
                />
              </div>
            </div>
          )}
          <div>
            <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-9 bg-black/30 border-white/10 text-white focus-visible:ring-yellow-400"
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-white/70 text-xs uppercase tracking-wider mb-1 block">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-9 bg-black/30 border-white/10 text-white focus-visible:ring-yellow-400"
                required
                minLength={6}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold mt-2">
            {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-white/30 text-xs mt-2">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-yellow-400 hover:underline">
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
