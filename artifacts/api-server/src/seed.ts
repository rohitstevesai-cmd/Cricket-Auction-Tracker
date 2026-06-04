import { db, playersTable, teamsTable } from "@workspace/db";
import { logger } from "./lib/logger";

const initialTeams = [
  { id: "team-001", name: "Mumbai Warriors", location: "Mumbai", color: "#1a73e8", description: "The defending champions", logo: "/images/mumbai-warriors.png", totalPoints: 300, usedPoints: 90 },
  { id: "team-002", name: "Chennai Kings", location: "Chennai", color: "#f59e0b", description: "Five-time title holders", logo: "/images/chennai-kings.png", totalPoints: 300, usedPoints: 105 },
  { id: "team-003", name: "Delhi Thunders", location: "Delhi", color: "#10b981", description: "Rising powerhouse of the north", logo: "/images/delhi-thunders.png", totalPoints: 300, usedPoints: 50 },
];

const initialPlayers = [
  { id: crypto.randomUUID(), name: "Rohit Sharma", age: 36, village: "Mumbai", playerType: "Batsman", additionalTag: "Captain", status: "sold", teamId: "team-001", photo: "", points: 50 },
  { id: crypto.randomUUID(), name: "Jasprit Bumrah", age: 30, village: "Ahmedabad", playerType: "Bowler", additionalTag: "Normal Player", status: "sold", teamId: "team-001", photo: "", points: 40 },
  { id: crypto.randomUUID(), name: "MS Dhoni", age: 42, village: "Ranchi", playerType: "Wicket-Keeper", additionalTag: "Captain", status: "sold", teamId: "team-002", photo: "", points: 60 },
  { id: crypto.randomUUID(), name: "Ravindra Jadeja", age: 35, village: "Jamnagar", playerType: "All-Rounder", additionalTag: "Vice Captain", status: "sold", teamId: "team-002", photo: "", points: 45 },
  { id: crypto.randomUUID(), name: "Rishabh Pant", age: 26, village: "Delhi", playerType: "Wicket-Keeper", additionalTag: "Vice Captain", status: "sold", teamId: "team-003", photo: "", points: 50 },
  { id: crypto.randomUUID(), name: "Shubman Gill", age: 24, village: "Fazilka", playerType: "Batsman", additionalTag: "Normal Player", status: "available", teamId: null, photo: "", points: 35 },
  { id: crypto.randomUUID(), name: "Mohammed Siraj", age: 30, village: "Hyderabad", playerType: "Bowler", additionalTag: "Normal Player", status: "available", teamId: null, photo: "", points: 30 },
  { id: crypto.randomUUID(), name: "Hardik Pandya", age: 30, village: "Surat", playerType: "All-Rounder", additionalTag: "Captain", status: "available", teamId: null, photo: "", points: 55 },
  { id: crypto.randomUUID(), name: "Virat Kohli", age: 35, village: "Delhi", playerType: "Batsman", additionalTag: "Captain", status: "available", teamId: null, photo: "", points: 65 },
  { id: crypto.randomUUID(), name: "Yuzvendra Chahal", age: 33, village: "Jind", playerType: "Bowler", additionalTag: "Normal Player", status: "available", teamId: null, photo: "", points: 25 },
];

export async function seedIfEmpty() {
  try {
    const existingTeams = await db.select().from(teamsTable);
    if (existingTeams.length > 0) {
      logger.info("DB already seeded, skipping.");
      return;
    }
    logger.info("Seeding initial data...");
    await db.insert(teamsTable).values(initialTeams);
    await db.insert(playersTable).values(initialPlayers);
    logger.info("Seed complete.");
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}
