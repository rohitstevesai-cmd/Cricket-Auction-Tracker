import { Router } from "express";
import { db } from "@workspace/db";
import { bettingSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const MARKETING_KEY = "marketing_headline";

// ── GET /spl-settings/marketing ──────────────────────────────────────────────
// Public — anyone (including visitors) can read the headline
router.get("/spl-settings/marketing", async (_req, res) => {
  try {
    const [row] = await db
      .select()
      .from(bettingSettingsTable)
      .where(eq(bettingSettingsTable.key, MARKETING_KEY));
    res.json({ headline: row?.value ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

// ── PUT /spl-settings/marketing ──────────────────────────────────────────────
// Admin only — set or clear the headline
router.put("/spl-settings/marketing", async (req, res) => {
  try {
    const { headline } = req.body as { headline: string | null };
    const value = headline?.trim() || null;

    await db
      .insert(bettingSettingsTable)
      .values({ key: MARKETING_KEY, value, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: bettingSettingsTable.key,
        set: { value, updatedAt: new Date().toISOString() },
      });

    res.json({ headline: value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

export default router;
