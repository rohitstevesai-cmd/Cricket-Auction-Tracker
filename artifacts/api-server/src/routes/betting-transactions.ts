import { Router } from "express";
import { db } from "@workspace/db";
import { bettingUsersTable, transactionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireUser(req: any, res: any): string | null {
  const userId = req.session?.bettingUserId;
  if (!userId) {
    res.status(401).json({ error: "Not logged in" });
    return null;
  }
  return userId;
}

function requireAdmin(req: any, res: any): boolean {
  if (req.session?.bettingAdminLoggedIn !== true) {
    res.status(403).json({ error: "Admin only" });
    return false;
  }
  return true;
}

// User: get own transactions
router.get("/betting/transactions", async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const txns = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).orderBy(desc(transactionsTable.createdAt));
    res.json(txns);
  } catch {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// User: request add money
router.post("/betting/transactions/add", async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const { amount, utrNo, imageUrl } = req.body;
    if (!amount || amount <= 0) return void res.status(400).json({ error: "Invalid amount" });
    if (!utrNo) return void res.status(400).json({ error: "UTR number is required" });
    if (!imageUrl) return void res.status(400).json({ error: "Payment screenshot is required" });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(transactionsTable).values({ id, userId, type: "add", amount, status: "pending", utrNo, imageUrl, note: null, adminNote: null, createdAt: now, updatedAt: now });
    res.status(201).json({ id, status: "pending" });
  } catch {
    res.status(500).json({ error: "Failed to submit request" });
  }
});

// User: withdraw money
router.post("/betting/transactions/withdraw", async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const { amount, note } = req.body;
    if (!amount || amount < 100) return void res.status(400).json({ error: "Minimum withdrawal amount is ₹100" });
    const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, userId)).limit(1);
    if (!users.length) return void res.status(404).json({ error: "User not found" });
    if (users[0].balance < amount) return void res.status(400).json({ error: "Insufficient balance" });
    // Deduct immediately and create pending withdrawal
    await db.update(bettingUsersTable).set({ balance: users[0].balance - amount }).where(eq(bettingUsersTable.id, userId));
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(transactionsTable).values({ id, userId, type: "withdraw", amount, status: "pending", utrNo: null, imageUrl: null, note: note || null, adminNote: null, createdAt: now, updatedAt: now });
    res.status(201).json({ id, status: "pending" });
  } catch {
    res.status(500).json({ error: "Failed to submit withdrawal" });
  }
});

// Admin: get all transactions
router.get("/betting/admin/transactions", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const txns = await db.select({
      id: transactionsTable.id,
      userId: transactionsTable.userId,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      status: transactionsTable.status,
      utrNo: transactionsTable.utrNo,
      imageUrl: transactionsTable.imageUrl,
      note: transactionsTable.note,
      adminNote: transactionsTable.adminNote,
      createdAt: transactionsTable.createdAt,
      updatedAt: transactionsTable.updatedAt,
      userName: bettingUsersTable.name,
      userEmail: bettingUsersTable.email,
    }).from(transactionsTable).leftJoin(bettingUsersTable, eq(transactionsTable.userId, bettingUsersTable.id)).orderBy(desc(transactionsTable.createdAt));
    res.json(txns);
  } catch {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Admin: approve/reject add-money request
router.put("/betting/admin/transactions/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { status, adminNote, manualAmount } = req.body;
    if (!["approved", "cancelled"].includes(status)) return void res.status(400).json({ error: "Invalid status" });
    const txns = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id)).limit(1);
    if (!txns.length) return void res.status(404).json({ error: "Transaction not found" });
    const txn = txns[0];
    const finalAmount = manualAmount && manualAmount > 0 ? manualAmount : txn.amount;
    await db.update(transactionsTable).set({ status, adminNote: adminNote || null, amount: finalAmount, updatedAt: new Date().toISOString() }).where(eq(transactionsTable.id, id));
    // Credit user if add-money is approved
    if (status === "approved" && txn.type === "add") {
      const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, txn.userId)).limit(1);
      if (users.length) {
        await db.update(bettingUsersTable).set({ balance: users[0].balance + finalAmount }).where(eq(bettingUsersTable.id, txn.userId));
      }
    }
    // Refund user if withdrawal is cancelled
    if (status === "cancelled" && txn.type === "withdraw" && txn.status === "pending") {
      const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, txn.userId)).limit(1);
      if (users.length) {
        await db.update(bettingUsersTable).set({ balance: users[0].balance + txn.amount }).where(eq(bettingUsersTable.id, txn.userId));
      }
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// Admin: get all users
router.get("/betting/admin/users", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const users = await db.select({ id: bettingUsersTable.id, email: bettingUsersTable.email, name: bettingUsersTable.name, balance: bettingUsersTable.balance, createdAt: bettingUsersTable.createdAt }).from(bettingUsersTable).orderBy(desc(bettingUsersTable.createdAt));
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Admin: update user balance
router.put("/betting/admin/users/:id/balance", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { balance } = req.body;
    if (balance === undefined || balance < 0) return void res.status(400).json({ error: "Invalid balance" });
    await db.update(bettingUsersTable).set({ balance }).where(eq(bettingUsersTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update balance" });
  }
});

// ── GET /betting/leaderboard ─────────────────────────────────────────────────
// Public — returns all users ranked by balance (no sensitive data)
router.get("/betting/leaderboard", async (_req, res) => {
  try {
    const users = await db
      .select({ id: bettingUsersTable.id, name: bettingUsersTable.name, balance: bettingUsersTable.balance })
      .from(bettingUsersTable)
      .orderBy(desc(bettingUsersTable.balance));
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
