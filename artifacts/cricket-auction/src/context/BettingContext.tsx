import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export interface BettingUser {
  id: string;
  email: string;
  name: string;
  balance: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "add" | "withdraw";
  amount: number;
  status: "pending" | "approved" | "cancelled";
  utrNo: string | null;
  imageUrl: string | null;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
}

export interface Match {
  id: string;
  title: string;
  team1: string;
  team2: string;
  teams: string[] | null;
  teamPayouts: Record<string, number> | null;
  matchDate: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
  winner: string | null;
  isSpecial: boolean;
  description: string;
  createdAt: string;
}

export interface Bet {
  id: string;
  matchId: string;
  betOn: string;
  amount: number;
  status: "pending" | "won" | "lost" | "refunded";
  payout: number;
  createdAt: string;
  matchTitle?: string;
  matchTeam1?: string;
  matchTeam2?: string;
  matchTeams?: string | null;
  matchIsSpecial?: boolean;
  matchStatus?: string;
  matchWinner?: string | null;
}

export interface AdminBet extends Bet {
  userId: string;
  userName: string;
  userEmail: string;
}

interface BettingContextType {
  user: BettingUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

const BASE = "/api";

export function BettingProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BettingUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/betting/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsAdmin(data.admin === true);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${BASE}/betting/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed" };
      setUser(data.user);
      setIsAdmin(data.admin === true);
      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const res = await fetch(`${BASE}/betting/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Registration failed" };
      setUser(data.user);
      setIsAdmin(false);
      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${BASE}/betting/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <BettingContext.Provider value={{ user, isAdmin, loading, login, register, logout, refreshUser }}>
      {children}
    </BettingContext.Provider>
  );
}

export function useBetting() {
  const ctx = useContext(BettingContext);
  if (!ctx) throw new Error("useBetting must be used within BettingProvider");
  return ctx;
}

export const bettingFetch = async (path: string, options?: RequestInit) => {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};
