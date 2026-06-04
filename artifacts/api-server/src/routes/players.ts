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
      status: body.status ?? "available",
      teamId: body.teamId ?? null,
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
    const { id: _id, createdAt: _c, ...updates } = req.body;
    const [updated] = await db.update(playersTable).set(updates).where(eq(playersTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Player not found" });
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
    if (!player || !team) return res.status(404).json({ error: "Player or team not found" });
    const available = team.totalPoints - team.usedPoints;
    if (available < player.points) {
      return res.status(400).json({ error: `Not enough points. Need ${player.points}, team has ${available} available.` });
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
    if (!player) return res.status(404).json({ error: "Player not found" });
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
