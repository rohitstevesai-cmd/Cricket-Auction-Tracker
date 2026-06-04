import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const bettingUsersTable = pgTable("betting_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  balance: integer("balance").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

export const transactionsTable = pgTable("betting_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => bettingUsersTable.id),
  type: text("type").notNull(), // "add" | "withdraw"
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "cancelled"
  utrNo: text("utr_no"),
  imageUrl: text("image_url"),
  note: text("note"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const matchesTable = pgTable("betting_matches", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  team1: text("team1").notNull(),
  team2: text("team2").notNull(),
  matchDate: timestamp("match_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("upcoming"), // "upcoming" | "live" | "completed" | "cancelled"
  winner: text("winner"), // "team1" | "team2" | "draw" | null
  isSpecial: boolean("is_special").notNull().default(false),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

export const betsTable = pgTable("betting_bets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => bettingUsersTable.id),
  matchId: text("match_id").notNull().references(() => matchesTable.id),
  betOn: text("bet_on").notNull(), // "team1" | "team2"
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "won" | "lost" | "refunded"
  payout: integer("payout").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});
