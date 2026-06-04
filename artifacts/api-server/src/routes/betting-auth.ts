import { Router } from "express";
import { db } from "@workspace/db";
import { bettingUsersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

const ADMIN_EMAIL = "admin6261@gmail.com";
const ADMIN_PASSWORD = "Admin@6261";

router.post("/betting/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password, and name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    await db.insert(bettingUsersTable).values({
      id,
      email: email.toLowerCase(),
      passwordHash,
      name,
      balance: 0,
    });
    const user = { id, email: email.toLowerCase(), name, balance: 0 };
    (req.session as any).bettingUserId = id;
    return res.status(201).json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/betting/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // Admin login
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      (req.session as any).bettingAdminLoggedIn = true;
      (req.session as any).bettingUserId = undefined;
      return res.json({ admin: true, user: { id: "admin", email: ADMIN_EMAIL, name: "Admin", balance: 0 } });
    }

    const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.email, email.toLowerCase())).limit(1);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    (req.session as any).bettingUserId = user.id;
    (req.session as any).bettingAdminLoggedIn = false;
    return res.json({ user: { id: user.id, email: user.email, name: user.name, balance: user.balance } });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/betting/auth/logout", (req, res) => {
  (req.session as any).bettingUserId = undefined;
  (req.session as any).bettingAdminLoggedIn = false;
  res.json({ ok: true });
});

router.get("/betting/auth/me", async (req, res) => {
  try {
    const isAdmin = (req.session as any).bettingAdminLoggedIn === true;
    if (isAdmin) {
      return res.json({ admin: true, user: { id: "admin", email: ADMIN_EMAIL, name: "Admin", balance: 0 } });
    }
    const userId = (req.session as any).bettingUserId;
    if (!userId) {
      return res.status(401).json({ error: "Not logged in" });
    }
    const users = await db.select().from(bettingUsersTable).where(eq(bettingUsersTable.id, userId)).limit(1);
    if (users.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    const u = users[0];
    return res.json({ user: { id: u.id, email: u.email, name: u.name, balance: u.balance } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
