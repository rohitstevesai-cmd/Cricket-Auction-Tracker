import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { supabaseConfig } from "../../../config";
const { Pool } = pg;
export const pool = new Pool({ connectionString: supabaseConfig.databaseUrl });
export const db = drizzle(pool, { schema });
export * from "./schema";
