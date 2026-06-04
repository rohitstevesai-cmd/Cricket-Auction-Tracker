import { Router } from "express";
import multer from "multer";
import { uploadToStorage } from "../lib/supabase-storage";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const ALLOWED_FOLDERS = ["players", "teams", "transactions"];

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const folder = typeof req.query.folder === "string" && ALLOWED_FOLDERS.includes(req.query.folder)
      ? req.query.folder
      : "misc";
    const ext = req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const url = await uploadToStorage(folder, filename, req.file.buffer, req.file.mimetype);
    return res.json({ url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

export default router;
