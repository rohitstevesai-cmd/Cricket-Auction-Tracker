import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const playersTable = pgTable("spl_players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  village: text("village").notNull(),
  playerType: text("player_type").notNull(),
  additionalTag: text("additional_tag").notNull().default("Normal Player"),
  photo: text("photo").notNull().default(""),
  status: text("status").notNull().default("available"),
  teamId: text("team_id"),
  points: integer("points").notNull().default(10),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

export const teamsTable = pgTable("spl_teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo").notNull().default(""),
  location: text("location").notNull(),
  color: text("color").notNull().default("#1a73e8"),
  description: text("description").notNull().default(""),
  totalPoints: integer("total_points").notNull().default(200),
  usedPoints: integer("used_points").notNull().default(0),
});

export * from "./betting";
export * from "./matches";
