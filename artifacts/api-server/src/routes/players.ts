import { Router } from "express";
import { db, playersTable, teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/players", async (_req, res) => {
  try {
    const players = await db.select().from(playersTable);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

router.post("/players", async (req, res) => {
  try {
    const body = req.body;
    const player = {
      id: body.id || crypto.randomUUID(),
      name: body.name,
      age: body.age,
      village: body.village,
      playerType: body.playerType,
      additionalTag: body.additionalTag ?? "Normal Player",
      photo: body.photo ?? "",
      // Always start as available — team assignment must go through /assign
      status: "available" as const,
      teamId: null,
      points: body.points ?? 10,
    };
    const [inserted] = await db.insert(playersTable).values(player).returning();
    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: "Failed to create player" });
  }
});

router.put("/players/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Strip teamId and status — these MUST go through /assign and /unassign
    const { id: _id, createdAt: _c, teamId: _tid, status: _st, ...safeUpdates } = req.body;

    // Fetch current player to check if points are changing while assigned
    const [current] = await db.select().from(playersTable).where(eq(playersTable.id, id));
    if (!current) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    // If points value is changing AND player is assigned to a team,
    // recalculate the team's usedPoints with the diff
    if (
      safeUpdates.points !== undefined &&
      safeUpdates.points !== current.points &&
      current.teamId
    ) {
      const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, current.teamId));
      if (team) {
        const diff = safeUpdates.points - current.points;
        const newUsed = Math.max(0, team.usedPoints + diff);
        // Check the team can afford the extra points (if increasing)
        if (diff > 0 && team.usedPoints + diff > team.totalPoints) {
          res.status(400).json({
            error: `Cannot increase player points: team only has ${team.totalPoints - team.usedPoints} pts remaining.`,
          });
          return;
        }
        await db
          .update(teamsTable)
          .set({ usedPoints: newUsed })
          .where(eq(teamsTable.id, current.teamId));
      }
    }

    const [updated] = await db
      .update(playersTable)
      .set(safeUpdates)
      .where(eq(playersTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update player" });
  }
});

router.delete("/players/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, id));
    if (player?.teamId) {
      const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, player.teamId));
      if (team) {
        await db.update(teamsTable)
          .set({ usedPoints: Math.max(0, team.usedPoints - player.points) })
          .where(eq(teamsTable.id, team.id));
      }
    }
    await db.delete(playersTable).where(eq(playersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete player" });
  }
});

router.post("/players/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { teamId } = req.body;
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, id));
    const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
    if (!player || !team) {
      res.status(404).json({ error: "Player or team not found" });
      return;
    }
    // Guard: player already belongs to a team
    if (player.teamId || player.status === "sold") {
      res.status(400).json({
        error: `${player.name} is already in a team. Remove them from their current team first.`,
      });
      return;
    }
    const available = team.totalPoints - team.usedPoints;
    if (available < player.points) {
      res.status(400).json({
        error: `Not enough points. ${player.name} costs ${player.points} pts but ${team.name} only has ${available} pts remaining.`,
      });
      return;
    }
    await db.update(playersTable).set({ status: "sold", teamId }).where(eq(playersTable.id, id));
    await db.update(teamsTable).set({ usedPoints: team.usedPoints + player.points }).where(eq(teamsTable.id, teamId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign player" });
  }
});

router.post("/players/:id/unassign", async (req, res) => {
  try {
    const { id } = req.params;
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, id));
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    if (player.teamId) {
      const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, player.teamId));
      if (team) {
        await db.update(teamsTable)
          .set({ usedPoints: Math.max(0, team.usedPoints - player.points) })
          .where(eq(teamsTable.id, team.id));
      }
    }
    await db.update(playersTable).set({ status: "available", teamId: null }).where(eq(playersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to unassign player" });
  }
});

export default router;
