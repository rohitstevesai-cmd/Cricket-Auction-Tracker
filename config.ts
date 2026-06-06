const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is required but was not provided.",
  );
}

export const supabaseConfig = {
  databaseUrl,
};
