import { useState, useEffect, useCallback, useRef } from "react";

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

export type MatchStatus = "upcoming" | "ongoing" | "completed";

export interface TeamInfo {
  id: string;
  name: string;
  logo: string;
  color: string;
  location: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  photo: string;
  playerType: string;
}

export interface SplMatch {
  id: string;
  team1Id: string;
  team2Id: string;
  venue: string;
  matchDate: string | null;
  overs: number;
  status: MatchStatus;
  winnerId: string | null;
  tossWinnerId: string | null;
  tossDecision: string | null;
  youtubeUrl: string | null;
  createdAt: string;
  team1: TeamInfo | null;
  team2: TeamInfo | null;
  winner: TeamInfo | null;
}

export interface SplBall {
  id: string;
  inningsId: string;
  overNumber: number;
  ballInOver: number;
  batsmanId: string;
  bowlerId: string;
  runsOffBat: number;
  extras: number;
  extrasType: string;
  isWicket: boolean;
  wicketType: string | null;
  fielderId: string | null;
  isLegal: boolean;
  createdAt: string;
  batsman: PlayerInfo | null;
  bowler: PlayerInfo | null;
  fielder: PlayerInfo | null;
}

export interface BatsmanStat {
  playerId: string;
  player: PlayerInfo | null;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType: string | null;
  dismissedBy: PlayerInfo | null;
  fielder: PlayerInfo | null;
  sr: number;
}

export interface BowlerStat {
  playerId: string;
  player: PlayerInfo | null;
  balls: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface OverSummary {
  over: number;
  runs: number;
  wickets: number;
}

export interface SplInnings {
  id: string;
  matchId: string;
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsCurrentOver: number;
  target: number | null;
  status: string;
  createdAt: string;
  battingTeam: TeamInfo | null;
  bowlingTeam: TeamInfo | null;
  balls: SplBall[];
  batsmenStats: BatsmanStat[];
  bowlerStats: BowlerStat[];
  overHistory: OverSummary[];
  currentOverBalls: SplBall[];
  winProb: number | null;
  winProbHistory: { over: number; prob: number }[];
  wormData: { over: number; runs: number }[];
}

export interface Scorecard {
  match: SplMatch;
  innings: SplInnings[];
}

export function useMatches() {
  const [matches, setMatches] = useState<SplMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch("/matches");
      setMatches(data);
    } catch (e) {
      console.error("Failed to load matches", e);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const createMatch = async (body: {
    team1Id: string; team2Id: string;
    venue: string; matchDate: string; overs: number;
  }) => {
    await apiFetch("/matches", { method: "POST", body: JSON.stringify(body) });
    await refresh();
  };

  const updateMatch = async (id: string, body: Partial<{
    status: MatchStatus; winnerId: string | null;
    tossWinnerId: string; tossDecision: string;
    venue: string; matchDate: string; overs: number;
  }>) => {
    await apiFetch(`/matches/${id}`, { method: "PUT", body: JSON.stringify(body) });
    await refresh();
  };

  const deleteMatch = async (id: string) => {
    await apiFetch(`/matches/${id}`, { method: "DELETE" });
    await refresh();
  };

  return { matches, loading, refresh, createMatch, updateMatch, deleteMatch };
}

export function useScorecard(matchId: string | undefined, pollMs = 3000) {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!matchId) return;
    try {
      const data = await apiFetch(`/matches/${matchId}/scorecard`);
      setScorecard(data);
    } catch (e) {
      console.error("Failed to load scorecard", e);
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));

    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, pollMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchId, refresh, pollMs]);

  const startInnings = async (body: {
    battingTeamId: string;
    bowlingTeamId: string;
    inningsNumber: number;
  }) => {
    if (!matchId) return;
    await apiFetch(`/matches/${matchId}/innings`, { method: "POST", body: JSON.stringify(body) });
    await refresh();
  };

  const addBall = async (inningsId: string, body: {
    batsmanId: string; bowlerId: string;
    runsOffBat: number; extras: number; extrasType: string;
    isWicket: boolean; wicketType?: string | null; fielderId?: string | null;
  }) => {
    const result = await apiFetch(`/innings/${inningsId}/balls`, { method: "POST", body: JSON.stringify(body) });
    await refresh();
    return result;
  };

  const undoBall = async (inningsId: string) => {
    await apiFetch(`/innings/${inningsId}/balls/last`, { method: "DELETE" });
    await refresh();
  };

  const completeInnings = async (inningsId: string) => {
    await apiFetch(`/innings/${inningsId}/complete`, { method: "PUT" });
    await refresh();
  };

  const updateMatch = async (body: Partial<{ status: string; winnerId: string | null; youtubeUrl: string | null }>) => {
    if (!matchId) return;
    await apiFetch(`/matches/${matchId}`, { method: "PUT", body: JSON.stringify(body) });
    await refresh();
  };

  return { scorecard, loading, refresh, startInnings, addBall, undoBall, completeInnings, updateMatch };
}
