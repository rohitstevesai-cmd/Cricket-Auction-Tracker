import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

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
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  location: string;
  color: string;
  description: string;
}

interface DataContextType {
  players: Player[];
  teams: Team[];
  addPlayer: (player: Omit<Player, "id" | "createdAt">) => void;
  editPlayer: (id: string, player: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  addTeam: (team: Omit<Team, "id">) => void;
  editTeam: (id: string, team: Partial<Team>) => void;
  deleteTeam: (id: string, deletePlayers: boolean) => void;
  assignPlayerToTeam: (playerId: string, teamId: string) => void;
  removePlayerFromTeam: (playerId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialTeams: Team[] = [
  { id: "team-001", name: "Mumbai Warriors", location: "Mumbai", color: "#1a73e8", description: "The defending champions", logo: "/images/mumbai-warriors.png" },
  { id: "team-002", name: "Chennai Kings", location: "Chennai", color: "#f59e0b", description: "Five-time title holders", logo: "/images/chennai-kings.png" },
  { id: "team-003", name: "Delhi Thunders", location: "Delhi", color: "#10b981", description: "Rising powerhouse of the north", logo: "/images/delhi-thunders.png" },
];

const initialPlayers: Player[] = [
  { id: uuidv4(), name: "Rohit Sharma", age: 36, village: "Mumbai", playerType: "Batsman", additionalTag: "Captain", status: "sold", teamId: "team-001", photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "Jasprit Bumrah", age: 30, village: "Ahmedabad", playerType: "Bowler", additionalTag: "Normal Player", status: "sold", teamId: "team-001", photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "MS Dhoni", age: 42, village: "Ranchi", playerType: "Wicket-Keeper", additionalTag: "Captain", status: "sold", teamId: "team-002", photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "Ravindra Jadeja", age: 35, village: "Jamnagar", playerType: "All-Rounder", additionalTag: "Vice Captain", status: "sold", teamId: "team-002", photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "Rishabh Pant", age: 26, village: "Delhi", playerType: "Wicket-Keeper", additionalTag: "Vice Captain", status: "sold", teamId: "team-003", photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "Shubman Gill", age: 24, village: "Fazilka", playerType: "Batsman", additionalTag: "Normal Player", status: "available", teamId: null, photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "Mohammed Siraj", age: 30, village: "Hyderabad", playerType: "Bowler", additionalTag: "Normal Player", status: "available", teamId: null, photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "Hardik Pandya", age: 30, village: "Surat", playerType: "All-Rounder", additionalTag: "Captain", status: "available", teamId: null, photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "Virat Kohli", age: 35, village: "Delhi", playerType: "Batsman", additionalTag: "Captain", status: "available", teamId: null, photo: "", createdAt: new Date().toISOString() },
  { id: uuidv4(), name: "Yuzvendra Chahal", age: 33, village: "Jind", playerType: "Bowler", additionalTag: "Normal Player", status: "available", teamId: null, photo: "", createdAt: new Date().toISOString() },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedPlayers = localStorage.getItem("auctionx_players");
    const savedTeams = localStorage.getItem("auctionx_teams");

    if (!savedPlayers || !savedTeams) {
      setPlayers(initialPlayers);
      setTeams(initialTeams);
      localStorage.setItem("auctionx_players", JSON.stringify(initialPlayers));
      localStorage.setItem("auctionx_teams", JSON.stringify(initialTeams));
    } else {
      setPlayers(JSON.parse(savedPlayers));
      setTeams(JSON.parse(savedTeams));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("auctionx_players", JSON.stringify(players));
    }
  }, [players, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("auctionx_teams", JSON.stringify(teams));
    }
  }, [teams, isLoaded]);

  const addPlayer = (player: Omit<Player, "id" | "createdAt">) => {
    const newPlayer = {
      ...player,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  const editPlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.map(p => {
      // Return unchanged if not deleted. We actually filter it out.
      return p;
    }).filter((p) => p.id !== id));
  };

  const addTeam = (team: Omit<Team, "id">) => {
    const newTeam = {
      ...team,
      id: uuidv4(),
    };
    setTeams((prev) => [...prev, newTeam]);
  };

  const editTeam = (id: string, updates: Partial<Team>) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTeam = (id: string, deletePlayersAlso: boolean) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
    if (deletePlayersAlso) {
      setPlayers((prev) => prev.filter((p) => p.teamId !== id));
    } else {
      setPlayers((prev) =>
        prev.map((p) => (p.teamId === id ? { ...p, teamId: null, status: "available" } : p))
      );
    }
  };

  const assignPlayerToTeam = (playerId: string, teamId: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, teamId, status: "sold" } : p))
    );
  };

  const removePlayerFromTeam = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, teamId: null, status: "available" } : p))
    );
  };

  if (!isLoaded) return null; // or loading skeleton

  return (
    <DataContext.Provider
      value={{
        players,
        teams,
        addPlayer,
        editPlayer,
        deletePlayer,
        addTeam,
        editTeam,
        deleteTeam,
        assignPlayerToTeam,
        removePlayerFromTeam,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
