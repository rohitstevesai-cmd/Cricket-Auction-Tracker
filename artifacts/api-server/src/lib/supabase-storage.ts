import { supabaseConfig } from "../../../../config";

const BUCKET = "images";
const BASE = `${supabaseConfig.url}/storage/v1`;
const AUTH = `Bearer ${supabaseConfig.serviceRoleKey}`;

async function ensureBucket(): Promise<void> {
  const listRes = await fetch(`${BASE}/bucket`, {
    headers: { Authorization: AUTH, apikey: supabaseConfig.serviceRoleKey },
  });
  if (!listRes.ok) return;
  const buckets: { name: string }[] = await listRes.json();
  if (buckets.some((b) => b.name === BUCKET)) return;

  await fetch(`${BASE}/bucket`, {
    method: "POST",
    headers: {
      Authorization: AUTH,
      apikey: supabaseConfig.serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
}

let bucketReady = false;

export async function uploadToStorage(
  folder: string,
  filename: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  if (!bucketReady) {
    await ensureBucket();
    bucketReady = true;
  }

  const path = `${folder}/${filename}`;
  const res = await fetch(`${BASE}/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: AUTH,
      apikey: supabaseConfig.serviceRoleKey,
      "Content-Type": mimetype,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Storage upload failed: ${msg}`);
  }

  return `${supabaseConfig.url}/storage/v1/object/public/${BUCKET}/${path}`;
}
