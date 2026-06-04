import { defineConfig } from "drizzle-kit";
import path from "path";
import { supabaseConfig } from "../../config";

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: supabaseConfig.databaseUrl,
  },
});
