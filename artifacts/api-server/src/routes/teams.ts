import { Router } from "express";
import { db, playersTable, teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/teams", async (_req, res) => {
  try {
    const teams = await db.select().from(teamsTable);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

router.post("/teams", async (req, res) => {
  try {
    const body = req.body;
    const team = {
      id: body.id || crypto.randomUUID(),
      name: body.name,
      logo: body.logo ?? "",
      location: body.location,
      color: body.color ?? "#1a73e8",
      description: body.description ?? "",
      totalPoints: body.totalPoints ?? 200,
      usedPoints: body.usedPoints ?? 0,
    };
    const [inserted] = await db.insert(teamsTable).values(team).returning();
    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: "Failed to create team" });
  }
});

router.put("/teams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { id: _id, ...updates } = req.body;
    const [updated] = await db.update(teamsTable).set(updates).where(eq(teamsTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update team" });
  }
});

router.delete("/teams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletePlayers: boolean = req.body.deletePlayers === true;
    if (deletePlayers) {
      await db.delete(playersTable).where(eq(playersTable.teamId, id));
    } else {
      await db.update(playersTable)
        .set({ teamId: null, status: "available" })
        .where(eq(playersTable.teamId, id));
    }
    await db.delete(teamsTable).where(eq(teamsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete teams" });
  }
});

export default router;
