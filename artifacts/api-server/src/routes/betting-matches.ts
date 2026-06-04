import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, betsTable, bettingUsersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (req.session?.bettingAdminLoggedIn !== true) {
    res.status(403).json({ error: "Admin only" });
    return false;
  }
  return true;
}

function requireUser(req: any, res: any): string | null {
  const userId = req.session?.bettingUserId;
  if (!userId) { res.status(401).json({ error: "Not logged in" }); return null; }
  return userId;
}

// Public: get all matches
router.get("/betting/matches", async (_req, res) => {
  try {
    const matches = await db.select().from(matchesTable).orderBy(desc(matchesTable.matchDate));
    res.json(matches);
  } catch {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// Admin: create match
router.post("/betting/admin/matches", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { title, team1, team2, matchDate, isSpecial, description } = req.body;
    if (!title || !team1 || !team2 || !matchDate) return res.status(400).json({ error: "title, team1, team2, matchDate required" });
    const id = crypto.randomUUID();
    await db.insert(matchesTable).values({ id, title, team1, team2, matchDate, isSpecial: !!isSpecial, description: description || "", status: "upcoming", winner: null });
    res.status(201).json({ id });
  } catch {
    res.status(500).json({ error: "Failed to create match" });
  }
});

// Admin: update match
router.put("/betting/admin/matches/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { title, team1, team2, matchDate, isSpecial, description, status } = req.body;
    await db.update(matchesTable).set({ title, team1, team2, matchDate, isSpecial: !!isSpecial, description: description || "", status: status || "upcoming" }).where(eq(matchesTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update match" });
  }
});

// Admin: declare winner & settle bets
router.post("/betting/admin/matches/:id/winner", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { winner } = req.body; // "team1" | "team2" | "draw"
    if (!["team1", "team2", "draw"].includes(winner)) return res.status(400).json({ error: "winner must be team1, team2, or draw" });
    await db.update(matchesTable).set({ winner, status: "completed" }).where(eq(matchesTable.id, id));
    // Settle bets
    const bets = await db.select().from(betsTable).where(eq(betsTable.matchId, id));
    for (const bet of bets) {
      if (winner === "draw") {
        // Refund all bets
        await db.update(betsTable).set({ status: "refunded", payout: bet.amount }).where(eq(betsTable.id, bet.id));
        const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, bet.userId)).limit(1);
        if (users.length) await db.update(bettingUsersTable).set({ balance: users[0].balance + bet.amount }).where(eq(bettingUsersTable.id, bet.userId));
      } else if (bet.betOn === winner) {
        const payout = bet.amount * 2;
        await db.update(betsTable).set({ status: "won", payout }).where(eq(betsTable.id, bet.id));
        const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, bet.userId)).limit(1);
        if (users.length) await db.update(bettingUsersTable).set({ balance: users[0].balance + payout }).where(eq(bettingUsersTable.id, bet.userId));
      } else {
        await db.update(betsTable).set({ status: "lost", payout: 0 }).where(eq(betsTable.id, bet.id));
      }
    }
    res.json({ ok: true, settled: bets.length });
  } catch {
    res.status(500).json({ error: "Failed to declare winner" });
  }
});

// Admin: delete match (cascade-deletes bets first)
router.delete("/betting/admin/matches/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    // Delete all bets for this match first, then the match itself
    await db.delete(betsTable).where(eq(betsTable.matchId, id));
    await db.delete(matchesTable).where(eq(matchesTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete match" });
  }
});

// User: place bet
router.post("/betting/bets", async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const { matchId, betOn, amount } = req.body;
    if (!matchId || !betOn || !amount) return res.status(400).json({ error: "matchId, betOn, amount required" });
    if (!["team1", "team2"].includes(betOn)) return res.status(400).json({ error: "betOn must be team1 or team2" });
    if (amount < 10) return res.status(400).json({ error: "Minimum bet is ₹10" });
    // Check match is upcoming/live
    const matches = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
    if (!matches.length) return res.status(404).json({ error: "Match not found" });
    if (!["upcoming", "live"].includes(matches[0].status)) return res.status(400).json({ error: "Betting is closed for this match" });
    // Check balance
    const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, userId)).limit(1);
    if (!users.length) return res.status(404).json({ error: "User not found" });
    if (users[0].balance < amount) return res.status(400).json({ error: "Insufficient balance" });
    // Deduct balance
    await db.update(bettingUsersTable).set({ balance: users[0].balance - amount }).where(eq(bettingUsersTable.id, userId));
    const id = crypto.randomUUID();
    await db.insert(betsTable).values({ id, userId, matchId, betOn, amount, status: "pending", payout: 0 });
    res.status(201).json({ id });
  } catch {
    res.status(500).json({ error: "Failed to place bet" });
  }
});

// User: get my bets
router.get("/betting/bets", async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const bets = await db.select({
      id: betsTable.id,
      matchId: betsTable.matchId,
      betOn: betsTable.betOn,
      amount: betsTable.amount,
      status: betsTable.status,
      payout: betsTable.payout,
      createdAt: betsTable.createdAt,
      matchTitle: matchesTable.title,
      matchTeam1: matchesTable.team1,
      matchTeam2: matchesTable.team2,
      matchStatus: matchesTable.status,
      matchWinner: matchesTable.winner,
    }).from(betsTable).leftJoin(matchesTable, eq(betsTable.matchId, matchesTable.id)).where(eq(betsTable.userId, userId)).orderBy(desc(betsTable.createdAt));
    res.json(bets);
  } catch {
    res.status(500).json({ error: "Failed to fetch bets" });
  }
});

// Admin: get all bets
router.get("/betting/admin/bets", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const bets = await db.select({
      id: betsTable.id,
      userId: betsTable.userId,
      matchId: betsTable.matchId,
      betOn: betsTable.betOn,
      amount: betsTable.amount,
      status: betsTable.status,
      payout: betsTable.payout,
      createdAt: betsTable.createdAt,
      userName: bettingUsersTable.name,
      userEmail: bettingUsersTable.email,
      matchTitle: matchesTable.title,
      matchTeam1: matchesTable.team1,
      matchTeam2: matchesTable.team2,
      matchWinner: matchesTable.winner,
    }).from(betsTable).leftJoin(bettingUsersTable, eq(betsTable.userId, bettingUsersTable.id)).leftJoin(matchesTable, eq(betsTable.matchId, matchesTable.id)).orderBy(desc(betsTable.createdAt));
    res.json(bets);
  } catch {
    res.status(500).json({ error: "Failed to fetch bets" });
  }
});

export default router;
