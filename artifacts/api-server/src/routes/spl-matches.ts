import { Router } from "express";
import { db } from "@workspace/db";
import {
  splMatchesTable, splInningsTable, splBallsTable,
  teamsTable, playersTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function calcWinProb(runsNeeded: number, ballsLeft: number, wicketsLeft: number): number {
  if (runsNeeded <= 0) return 97;
  if (ballsLeft <= 0) return 3;
  if (wicketsLeft <= 0) return 3;
  const rrr = (runsNeeded / ballsLeft) * 6;
  const maxRate = 4.5 + wicketsLeft * 1.1;
  const ratio = rrr / maxRate;
  let p: number;
  if (ratio <= 0.4) p = 90;
  else if (ratio <= 0.6) p = 78;
  else if (ratio <= 0.75) p = 65;
  else if (ratio <= 0.9) p = 52;
  else if (ratio <= 1.0) p = 40;
  else if (ratio <= 1.15) p = 26;
  else if (ratio <= 1.35) p = 14;
  else p = 6;
  return Math.max(3, Math.min(97, p));
}

function recalcFromBalls(balls: any[]) {
  let totalRuns = 0, totalWickets = 0, oversCompleted = 0, ballsCurrentOver = 0;
  for (const b of balls) {
    totalRuns += (b.runsOffBat ?? 0) + (b.extras ?? 0);
    if (b.isWicket) totalWickets++;
    if (b.isLegal) {
      ballsCurrentOver++;
      if (ballsCurrentOver >= 6) { oversCompleted++; ballsCurrentOver = 0; }
    }
  }
  return { totalRuns, totalWickets, oversCompleted, ballsCurrentOver };
}

function computeStatsFromBalls(balls: any[], playerMap: Record<string, any>) {
  const batsmenMap: Record<string, any> = {};
  const bowlerMap: Record<string, any> = {};

  for (const b of balls) {
    // Batting
    if (!batsmenMap[b.batsmanId]) {
      batsmenMap[b.batsmanId] = { playerId: b.batsmanId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissalType: null, dismissedById: null, catchFielderId: null };
    }
    batsmenMap[b.batsmanId].runs += b.runsOffBat ?? 0;
    if (b.isLegal) batsmenMap[b.batsmanId].balls++;
    if ((b.runsOffBat ?? 0) === 4) batsmenMap[b.batsmanId].fours++;
    if ((b.runsOffBat ?? 0) === 6) batsmenMap[b.batsmanId].sixes++;
    if (b.isWicket) {
      batsmenMap[b.batsmanId].isOut = true;
      batsmenMap[b.batsmanId].dismissalType = b.wicketType;
      batsmenMap[b.batsmanId].dismissedById = b.bowlerId;
      batsmenMap[b.batsmanId].catchFielderId = b.fielderId || null;
    }

    // Bowling
    if (!bowlerMap[b.bowlerId]) {
      bowlerMap[b.bowlerId] = { playerId: b.bowlerId, balls: 0, runs: 0, wickets: 0 };
    }
    if (b.isLegal) bowlerMap[b.bowlerId].balls++;
    const concede = b.extrasType === "bye" || b.extrasType === "legbye"
      ? (b.runsOffBat ?? 0)
      : (b.runsOffBat ?? 0) + (b.extras ?? 0);
    bowlerMap[b.bowlerId].runs += concede;
    if (b.isWicket && b.wicketType !== "runout") bowlerMap[b.bowlerId].wickets++;
  }

  const batsmenStats = Object.values(batsmenMap).map((s: any) => ({
    ...s,
    player: playerMap[s.playerId] || null,
    dismissedBy: s.dismissedById ? playerMap[s.dismissedById] : null,
    fielder: s.catchFielderId ? playerMap[s.catchFielderId] : null,
    sr: s.balls > 0 ? Math.round((s.runs / s.balls) * 100) : 0,
  }));

  const bowlerStats = Object.values(bowlerMap).map((s: any) => ({
    ...s,
    player: playerMap[s.playerId] || null,
    overs: `${Math.floor(s.balls / 6)}.${s.balls % 6}`,
    economy: s.balls > 0 ? Math.round((s.runs / (s.balls / 6)) * 10) / 10 : 0,
  }));

  return { batsmenStats, bowlerStats };
}

// ── GET /matches ──────────────────────────────────────────────────────────────
router.get("/matches", async (_req, res) => {
  try {
    const matches = await db.select().from(splMatchesTable).orderBy(desc(splMatchesTable.createdAt));
    const teams = await db.select().from(teamsTable);
    const teamMap: Record<string, any> = Object.fromEntries(teams.map(t => [t.id, t]));

    const enriched = await Promise.all(matches.map(async (m) => {
      const innings = await db.select().from(splInningsTable).where(eq(splInningsTable.matchId, m.id));
      return {
        ...m,
        team1: teamMap[m.team1Id] || null,
        team2: teamMap[m.team2Id] || null,
        winner: m.winnerId ? teamMap[m.winnerId] : null,
        innings: innings.map(inn => ({
          id: inn.id,
          inningsNumber: inn.inningsNumber,
          battingTeamId: inn.battingTeamId,
          totalRuns: inn.totalRuns,
          totalWickets: inn.totalWickets,
          oversCompleted: inn.oversCompleted,
          ballsCurrentOver: inn.ballsCurrentOver,
          target: inn.target,
          status: inn.status,
        })),
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// ── GET /matches/:id/scorecard ────────────────────────────────────────────────
router.get("/matches/:id/scorecard", async (req, res) => {
  try {
    const { id } = req.params;
    const [match] = await db.select().from(splMatchesTable).where(eq(splMatchesTable.id, id));
    if (!match) return void res.status(404).json({ error: "Match not found" });

    const teams = await db.select().from(teamsTable);
    const teamMap: Record<string, any> = Object.fromEntries(teams.map(t => [t.id, t]));
    const players = await db.select().from(playersTable);
    const playerMap: Record<string, any> = Object.fromEntries(players.map(p => [p.id, p]));

    const allInnings = await db.select().from(splInningsTable)
      .where(eq(splInningsTable.matchId, id))
      .orderBy(splInningsTable.inningsNumber);

    const enrichedInnings = await Promise.all(allInnings.map(async (inn) => {
      const balls = await db.select().from(splBallsTable)
        .where(eq(splBallsTable.inningsId, inn.id))
        .orderBy(splBallsTable.createdAt);

      const enrichedBalls = balls.map(b => ({
        ...b,
        batsman: playerMap[b.batsmanId] || null,
        bowler: playerMap[b.bowlerId] || null,
        fielder: b.fielderId ? playerMap[b.fielderId] : null,
      }));

      const { batsmenStats, bowlerStats } = computeStatsFromBalls(balls, playerMap);

      // Over history
      const overMap: Record<number, { runs: number; wickets: number }> = {};
      for (const b of balls) {
        if (overMap[b.overNumber] === undefined) overMap[b.overNumber] = { runs: 0, wickets: 0 };
        overMap[b.overNumber].runs += (b.runsOffBat ?? 0) + (b.extras ?? 0);
        if (b.isWicket) overMap[b.overNumber].wickets++;
      }
      const overHistory = Object.entries(overMap)
        .map(([ov, d]) => ({ over: parseInt(ov) + 1, ...d }))
        .sort((a, b) => a.over - b.over);

      // Worm (cumulative runs per over for this innings)
      let cumRuns = 0;
      const wormData: { over: number; runs: number }[] = [];
      for (const ov of overHistory) {
        cumRuns += ov.runs;
        wormData.push({ over: ov.over, runs: cumRuns });
      }

      // Current over balls (last balls of current over)
      const currentOverBalls = enrichedBalls.filter(b => b.overNumber === inn.oversCompleted).slice(-8);

      // Win probability
      let winProb: number | null = null;
      const winProbHistory: { over: number; prob: number }[] = [];

      if (inn.inningsNumber === 2 && inn.target) {
        const totalBalls = match.overs * 6;
        const ballsUsed = inn.oversCompleted * 6 + inn.ballsCurrentOver;
        const ballsLeft = totalBalls - ballsUsed;
        const wicketsLeft = 10 - inn.totalWickets;
        winProb = calcWinProb(inn.target - inn.totalRuns, ballsLeft, wicketsLeft);

        let cumR = 0, cumW = 0;
        for (const ov of overHistory) {
          cumR += ov.runs;
          cumW += ov.wickets;
          const bl = totalBalls - ov.over * 6;
          const wl = 10 - cumW;
          winProbHistory.push({ over: ov.over, prob: calcWinProb(inn.target - cumR, bl, wl) });
        }
      }

      return {
        ...inn,
        battingTeam: teamMap[inn.battingTeamId] || null,
        bowlingTeam: teamMap[inn.bowlingTeamId] || null,
        balls: enrichedBalls,
        batsmenStats,
        bowlerStats,
        overHistory,
        wormData,
        currentOverBalls,
        winProb,
        winProbHistory,
      };
    }));

    res.json({
      match: {
        ...match,
        team1: teamMap[match.team1Id] || null,
        team2: teamMap[match.team2Id] || null,
        winner: match.winnerId ? teamMap[match.winnerId] : null,
      },
      innings: enrichedInnings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch scorecard" });
  }
});

// ── POST /matches ─────────────────────────────────────────────────────────────
router.post("/matches", async (req, res) => {
  try {
    const { team1Id, team2Id, venue, matchDate, overs } = req.body;
    const [inserted] = await db.insert(splMatchesTable).values({
      id: crypto.randomUUID(),
      team1Id, team2Id,
      venue: venue || "",
      matchDate: matchDate || null,
      overs: overs || 20,
      status: "upcoming",
      winnerId: null,
      tossWinnerId: null,
      tossDecision: null,
    }).returning();
    res.json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create match" });
  }
});

// ── PUT /matches/:id ──────────────────────────────────────────────────────────
router.put("/matches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["status", "winnerId", "tossWinnerId", "tossDecision", "venue", "matchDate", "overs", "youtubeUrl"] as const;
    const updates: any = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const [updated] = await db.update(splMatchesTable).set(updates).where(eq(splMatchesTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update match" });
  }
});

// ── DELETE /matches/:id ───────────────────────────────────────────────────────
router.delete("/matches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // cascade delete innings + balls manually (no FK cascade in drizzle without it set)
    const innings = await db.select().from(splInningsTable).where(eq(splInningsTable.matchId, id));
    for (const inn of innings) {
      await db.delete(splBallsTable).where(eq(splBallsTable.inningsId, inn.id));
    }
    await db.delete(splInningsTable).where(eq(splInningsTable.matchId, id));
    await db.delete(splMatchesTable).where(eq(splMatchesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete match" });
  }
});

// ── POST /matches/:id/innings ─────────────────────────────────────────────────
router.post("/matches/:id/innings", async (req, res) => {
  try {
    const { id } = req.params;
    const { battingTeamId, bowlingTeamId, inningsNumber } = req.body;

    const [match] = await db.select().from(splMatchesTable).where(eq(splMatchesTable.id, id));
    if (!match) return void res.status(404).json({ error: "Match not found" });

    let target: number | null = null;
    if (inningsNumber === 2) {
      const [first] = await db.select().from(splInningsTable).where(
        and(eq(splInningsTable.matchId, id), eq(splInningsTable.inningsNumber, 1))
      );
      if (first) target = first.totalRuns + 1;
    }

    await db.update(splMatchesTable).set({ status: "ongoing" }).where(eq(splMatchesTable.id, id));

    const [inserted] = await db.insert(splInningsTable).values({
      id: crypto.randomUUID(),
      matchId: id,
      inningsNumber,
      battingTeamId,
      bowlingTeamId,
      totalRuns: 0,
      totalWickets: 0,
      oversCompleted: 0,
      ballsCurrentOver: 0,
      target,
      status: "in_progress",
    }).returning();

    res.json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start innings" });
  }
});

// ── PATCH /innings/:id/lineup ─────────────────────────────────────────────────
router.patch("/innings/:id/lineup", async (req, res) => {
  try {
    const { id } = req.params;
    const { strikerId, nonStrikerId, bowlerId } = req.body;
    const updates: any = {};
    if (strikerId !== undefined) updates.currentStrikerId = strikerId || null;
    if (nonStrikerId !== undefined) updates.currentNonStrikerId = nonStrikerId || null;
    if (bowlerId !== undefined) updates.currentBowlerId = bowlerId || null;
    const [updated] = await db.update(splInningsTable).set(updates).where(eq(splInningsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update lineup" });
  }
});

// ── PUT /innings/:id/complete ─────────────────────────────────────────────────
router.put("/innings/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.update(splInningsTable)
      .set({ status: "completed" })
      .where(eq(splInningsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to complete innings" });
  }
});

// ── POST /innings/:id/balls ───────────────────────────────────────────────────
router.post("/innings/:id/balls", async (req, res) => {
  try {
    const { id } = req.params;
    const { batsmanId, bowlerId, runsOffBat, extras, extrasType, isWicket, wicketType, fielderId } = req.body;

    const [inn] = await db.select().from(splInningsTable).where(eq(splInningsTable.id, id));
    if (!inn) return void res.status(404).json({ error: "Innings not found" });
    if (inn.status === "completed") return void res.status(400).json({ error: "Innings is completed" });

    const isLegal = extrasType !== "wide" && extrasType !== "noball";

    // Guard: if 6 legal balls already bowled this over, reject until over is confirmed new
    // (prevents race conditions from rapid clicking sending extra balls in same over)
    const [matchRowCheck] = await db.select().from(splMatchesTable).where(eq(splMatchesTable.id, inn.matchId));
    if (inn.ballsCurrentOver >= 6) {
      return void res.status(400).json({ error: "Over is complete — select a new bowler before continuing" });
    }
    // Guard: innings overs fully bowled
    if (inn.oversCompleted >= matchRowCheck.overs) {
      return void res.status(400).json({ error: "All overs bowled — innings must be completed" });
    }

    const totalRunsOnBall = (runsOffBat ?? 0) + (extras ?? 0);

    await db.insert(splBallsTable).values({
      id: crypto.randomUUID(),
      inningsId: id,
      overNumber: inn.oversCompleted,
      ballInOver: inn.ballsCurrentOver + (isLegal ? 1 : 0),
      batsmanId, bowlerId,
      runsOffBat: runsOffBat ?? 0,
      extras: extras ?? 0,
      extrasType: extrasType || "none",
      isWicket: !!isWicket,
      wicketType: wicketType || null,
      fielderId: fielderId || null,
      isLegal,
    });

    let ballsInOver = inn.ballsCurrentOver;
    let oversComp = inn.oversCompleted;
    let totalWickts = inn.totalWickets + (isWicket ? 1 : 0);
    let totalRuns = inn.totalRuns + totalRunsOnBall;

    if (isLegal) {
      ballsInOver++;
      if (ballsInOver >= 6) { oversComp++; ballsInOver = 0; }
    }

    // Auto-complete check
    const [matchRow] = await db.select().from(splMatchesTable).where(eq(splMatchesTable.id, inn.matchId));
    let newStatus = inn.status;
    if (totalWickts >= 10 || oversComp >= matchRow.overs) newStatus = "completed";
    if (inn.target !== null && totalRuns >= inn.target) newStatus = "completed";

    await db.update(splInningsTable).set({
      totalRuns, totalWickets: totalWickts,
      oversCompleted: oversComp, ballsCurrentOver: ballsInOver,
      status: newStatus,
    }).where(eq(splInningsTable.id, id));

    const [updatedInn] = await db.select().from(splInningsTable).where(eq(splInningsTable.id, id));
    res.json({ innings: updatedInn, autoCompleted: newStatus === "completed" && inn.status !== "completed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add ball" });
  }
});

// ── DELETE /innings/:id/balls/last ────────────────────────────────────────────
router.delete("/innings/:id/balls/last", async (req, res) => {
  try {
    const { id } = req.params;

    const allBalls = await db.select().from(splBallsTable)
      .where(eq(splBallsTable.inningsId, id))
      .orderBy(desc(splBallsTable.createdAt));

    if (!allBalls.length) return void res.status(400).json({ error: "No balls to undo" });

    await db.delete(splBallsTable).where(eq(splBallsTable.id, allBalls[0].id));

    const remaining = allBalls.slice(1).reverse();
    const recalc = recalcFromBalls(remaining);

    await db.update(splInningsTable).set({
      ...recalc,
      status: "in_progress",
    }).where(eq(splInningsTable.id, id));

    const [updatedInn] = await db.select().from(splInningsTable).where(eq(splInningsTable.id, id));
    res.json({ success: true, innings: updatedInn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to undo ball" });
  }
});

export default router;
