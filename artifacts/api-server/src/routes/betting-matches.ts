import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, betsTable, bettingUsersTable, bettingSettingsTable } from "@workspace/db/schema";
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

function getDefaultMultiplier(teamCount: number): number {
  if (teamCount <= 2) return 1.9;
  if (teamCount === 3) return 2.8;
  return teamCount + 0.8;
}

function parseMatch(m: any) {
  return {
    ...m,
    teams: m.teams ? JSON.parse(m.teams) : null,
    teamPayouts: m.teamPayouts ? JSON.parse(m.teamPayouts) : null,
  };
}

// ─── PUBLIC SETTINGS ───────────────────────────────────────────────

router.get("/betting/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(bettingSettingsTable);
    const settings: Record<string, string> = {};
    for (const r of rows) if (r.value) settings[r.key] = r.value;
    res.json(settings);
  } catch {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// ─── ADMIN SETTINGS ─────────────────────────────────────────────────

router.put("/betting/admin/settings", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { key, value } = req.body;
    if (!key) return void res.status(400).json({ error: "key required" });
    await db.insert(bettingSettingsTable)
      .values({ key, value, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: bettingSettingsTable.key,
        set: { value, updatedAt: new Date().toISOString() },
      });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ─── MATCHES ─────────────────────────────────────────────────────────

router.get("/betting/matches", async (_req, res) => {
  try {
    const matches = await db.select().from(matchesTable).orderBy(desc(matchesTable.matchDate));
    res.json(matches.map(parseMatch));
  } catch {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

router.post("/betting/admin/matches", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { title, team1, team2, matchDate, isSpecial, description, teams, teamPayouts } = req.body;
    const teamsArray: string[] | null = isSpecial && Array.isArray(teams) && teams.length >= 2 ? teams : null;
    const t1 = teamsArray ? teamsArray[0] : team1;
    const t2 = teamsArray ? teamsArray[1] : team2;
    if (!title || !t1 || !t2 || !matchDate) return void res.status(400).json({ error: "title, teams, matchDate required" });
    const id = crypto.randomUUID();
    await db.insert(matchesTable).values({
      id, title, team1: t1, team2: t2, matchDate,
      isSpecial: !!isSpecial, description: description || "",
      status: "upcoming", winner: null,
      teams: teamsArray ? JSON.stringify(teamsArray) : null,
      teamPayouts: teamPayouts && typeof teamPayouts === "object" ? JSON.stringify(teamPayouts) : null,
    });
    res.status(201).json({ id });
  } catch {
    res.status(500).json({ error: "Failed to create match" });
  }
});

router.put("/betting/admin/matches/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { title, team1, team2, matchDate, isSpecial, description, status, teams, teamPayouts } = req.body;
    const teamsArray: string[] | null = isSpecial && Array.isArray(teams) && teams.length >= 2 ? teams : null;
    const t1 = teamsArray ? teamsArray[0] : team1;
    const t2 = teamsArray ? teamsArray[1] : team2;
    await db.update(matchesTable).set({
      title, team1: t1, team2: t2, matchDate,
      isSpecial: !!isSpecial, description: description || "",
      status: status || "upcoming",
      teams: teamsArray ? JSON.stringify(teamsArray) : null,
      teamPayouts: teamPayouts && typeof teamPayouts === "object" ? JSON.stringify(teamPayouts) : null,
    }).where(eq(matchesTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update match" });
  }
});

router.post("/betting/admin/matches/:id/winner", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { winner } = req.body;

    const matchRows = await db.select().from(matchesTable).where(eq(matchesTable.id, id)).limit(1);
    if (!matchRows.length) return void res.status(404).json({ error: "Match not found" });
    const match = matchRows[0];

    const teamsArray: string[] | null = match.teams ? JSON.parse(match.teams) : null;
    const teamPayoutsObj: Record<string, number> | null = match.teamPayouts ? JSON.parse(match.teamPayouts) : null;
    const validWinners = teamsArray ? [...teamsArray, "draw"] : ["team1", "team2", "draw"];
    if (!validWinners.includes(winner)) {
      return void res.status(400).json({ error: `winner must be one of: ${validWinners.join(", ")}` });
    }

    const defaultMultiplier = teamsArray ? getDefaultMultiplier(teamsArray.length) : 1.9;

    await db.update(matchesTable).set({ winner, status: "completed" }).where(eq(matchesTable.id, id));

    const bets = await db.select().from(betsTable).where(eq(betsTable.matchId, id));
    let settled = 0;
    for (const bet of bets) {
      if (winner === "draw") {
        await db.update(betsTable).set({ status: "refunded", payout: bet.amount }).where(eq(betsTable.id, bet.id));
        const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, bet.userId)).limit(1);
        if (users.length) await db.update(bettingUsersTable).set({ balance: users[0].balance + bet.amount }).where(eq(bettingUsersTable.id, bet.userId));
      } else if (bet.betOn === winner) {
        const multiplier = teamPayoutsObj?.[bet.betOn] ?? defaultMultiplier;
        const payout = Math.round(bet.amount * multiplier);
        await db.update(betsTable).set({ status: "won", payout }).where(eq(betsTable.id, bet.id));
        const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, bet.userId)).limit(1);
        if (users.length) await db.update(bettingUsersTable).set({ balance: users[0].balance + payout }).where(eq(bettingUsersTable.id, bet.userId));
      } else {
        await db.update(betsTable).set({ status: "lost", payout: 0 }).where(eq(betsTable.id, bet.id));
      }
      settled++;
    }
    res.json({ ok: true, settled, defaultMultiplier });
  } catch {
    res.status(500).json({ error: "Failed to declare winner" });
  }
});

router.delete("/betting/admin/matches/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    await db.delete(betsTable).where(eq(betsTable.matchId, id));
    await db.delete(matchesTable).where(eq(matchesTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete match" });
  }
});

// ─── BETS ─────────────────────────────────────────────────────────────

router.post("/betting/bets", async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const { matchId, betOn, amount } = req.body;
    if (!matchId || !betOn || !amount) return void res.status(400).json({ error: "matchId, betOn, amount required" });
    if (amount < 10) return void res.status(400).json({ error: "Minimum bet is ₹10" });

    const matches = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
    if (!matches.length) return void res.status(404).json({ error: "Match not found" });
    const match = matches[0];
    if (!["upcoming", "live"].includes(match.status)) return void res.status(400).json({ error: "Betting is closed for this match" });

    const teamsArray: string[] | null = match.teams ? JSON.parse(match.teams) : null;
    const validBetOn = teamsArray ? teamsArray : ["team1", "team2"];
    if (!validBetOn.includes(betOn)) return void res.status(400).json({ error: `betOn must be one of: ${validBetOn.join(", ")}` });

    const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, userId)).limit(1);
    if (!users.length) return void res.status(404).json({ error: "User not found" });
    if (users[0].balance < amount) return void res.status(400).json({ error: "Insufficient balance" });

    await db.update(bettingUsersTable).set({ balance: users[0].balance - amount }).where(eq(bettingUsersTable.id, userId));
    const id = crypto.randomUUID();
    await db.insert(betsTable).values({ id, userId, matchId, betOn, amount, status: "pending", payout: 0 });
    res.status(201).json({ id });
  } catch {
    res.status(500).json({ error: "Failed to place bet" });
  }
});

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
      matchTeams: matchesTable.teams,
      matchIsSpecial: matchesTable.isSpecial,
      matchTeamPayouts: matchesTable.teamPayouts,
    }).from(betsTable).leftJoin(matchesTable, eq(betsTable.matchId, matchesTable.id)).where(eq(betsTable.userId, userId)).orderBy(desc(betsTable.createdAt));
    res.json(bets);
  } catch {
    res.status(500).json({ error: "Failed to fetch bets" });
  }
});

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
      matchTeams: matchesTable.teams,
    }).from(betsTable).leftJoin(bettingUsersTable, eq(betsTable.userId, bettingUsersTable.id)).leftJoin(matchesTable, eq(betsTable.matchId, matchesTable.id)).orderBy(desc(betsTable.createdAt));
    res.json(bets);
  } catch {
    res.status(500).json({ error: "Failed to fetch bets" });
  }
});

export default router;
