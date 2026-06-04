import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { supabaseConfig } from "../../../../config";

export const supabaseAdmin = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey,
  { realtime: { transport: ws } },
);

export const BUCKET = "images";

export async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  }
}

export async function uploadToStorage(
  folder: string,
  filename: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  await ensureBucket();
  const path = `${folder}/${filename}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimetype, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
