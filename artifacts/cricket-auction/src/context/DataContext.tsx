import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";

export type PlayerType = "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper";
export type AdditionalTag = "Normal Player" | "Captain" | "Vice Captain";
export type PlayerStatus = "available" | "sold";

export interface Player {
  id: string;
  name: string;
  age: number;
  village: string;
  playerType: PlayerType;
  additionalTag: AdditionalTag;
  photo: string;
  status: PlayerStatus;
  teamId: string | null;
  points: number;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  location: string;
  color: string;
  description: string;
  totalPoints: number;
  usedPoints: number;
}

interface DataContextType {
  players: Player[];
  teams: Team[];
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  addPlayer: (player: Omit<Player, "id" | "createdAt">) => Promise<void>;
  editPlayer: (id: string, player: Partial<Player>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  addTeam: (team: Omit<Team, "id">) => Promise<void>;
  editTeam: (id: string, team: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string, deletePlayers: boolean) => Promise<void>;
  assignPlayerToTeam: (playerId: string, teamId: string) => Promise<{ error?: string }>;
  removePlayerFromTeam: (playerId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const BASE = "/api";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

const POLL_INTERVAL_MS = 8000;

export function DataProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([
        apiFetch("/players"),
        apiFetch("/teams"),
      ]);
      setPlayers(p);
      setTeams(t);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }, POLL_INTERVAL_MS);
  }, [refresh]);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    startPolling();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, startPolling, stopPolling]);

  const addPlayer = async (player: Omit<Player, "id" | "createdAt">) => {
    await apiFetch("/players", { method: "POST", body: JSON.stringify(player) });
    await refresh();
  };

  const editPlayer = async (id: string, updates: Partial<Player>) => {
    await apiFetch(`/players/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    await refresh();
  };

  const deletePlayer = async (id: string) => {
    await apiFetch(`/players/${id}`, { method: "DELETE" });
    await refresh();
  };

  const addTeam = async (team: Omit<Team, "id">) => {
    await apiFetch("/teams", { method: "POST", body: JSON.stringify(team) });
    await refresh();
  };

  const editTeam = async (id: string, updates: Partial<Team>) => {
    await apiFetch(`/teams/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    await refresh();
  };

  const deleteTeam = async (id: string, deletePlayers: boolean) => {
    await apiFetch(`/teams/${id}`, { method: "DELETE", body: JSON.stringify({ deletePlayers }) });
    await refresh();
  };

  const assignPlayerToTeam = async (playerId: string, teamId: string): Promise<{ error?: string }> => {
    try {
      await apiFetch(`/players/${playerId}/assign`, { method: "POST", body: JSON.stringify({ teamId }) });
      await refresh();
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const removePlayerFromTeam = async (playerId: string) => {
    await apiFetch(`/players/${playerId}/unassign`, { method: "POST" });
    await refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Loading SPL Data...</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{
      players, teams, loading, lastUpdated, refresh,
      addPlayer, editPlayer, deletePlayer,
      addTeam, editTeam, deleteTeam,
      assignPlayerToTeam, removePlayerFromTeam,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error("useData must be used within a DataProvider");
  return context;
}
