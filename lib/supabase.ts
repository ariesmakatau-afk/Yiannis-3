// lib/supabase.ts
//
// A thin wrapper over Supabase's REST endpoints, using plain `fetch`.
//
// Deliberately no @supabase/supabase-js: the project has zero runtime
// dependencies beyond Next and React, and everything needed here is a few
// HTTP calls. Fewer packages means fewer upgrades and less to break.
//
// SERVER-SIDE ONLY. This module uses the service_role key, which bypasses
// Row Level Security. It must never be imported into a client component.

const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True when the database is configured. Lets callers degrade gracefully. */
export function isConfigured(): boolean {
  return Boolean(URL && SERVICE_KEY);
}

function requireConfig(): { url: string; key: string } {
  if (!URL || !SERVICE_KEY) {
    throw new Error(
      "Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return { url: URL, key: SERVICE_KEY };
}

function headers(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** SELECT. `query` is a PostgREST query string, e.g. "status=eq.new&order=created_at.desc". */
export async function select<T>(table: string, query = ""): Promise<T[]> {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: headers(key),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase select ${table} failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/** INSERT one row, returning the created record. */
export async function insert<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert ${table} failed (${res.status}): ${await res.text()}`);
  }
  const rows = (await res.json()) as T[];
  return rows[0];
}

/** UPDATE rows matching a PostgREST filter. */
export async function update<T>(
  table: string,
  query: string,
  patch: Record<string, unknown>
): Promise<T[]> {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Supabase update ${table} failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/**
 * DELETE rows matching a PostgREST filter.
 * Currently unused — orders are archived, never deleted. Kept for future use.
 */
export async function remove(table: string, query: string): Promise<void> {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: headers(key),
  });
  if (!res.ok) {
    throw new Error(`Supabase delete ${table} failed (${res.status}): ${await res.text()}`);
  }
}

/** Upsert a single site_content value. */
export async function setContent(key: string, value: string | null): Promise<void> {
  const { url, key: serviceKey } = requireConfig();
  const res = await fetch(`${url}/rest/v1/site_content`, {
    method: "POST",
    headers: headers(serviceKey, {
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) {
    throw new Error(`Supabase setContent failed (${res.status}): ${await res.text()}`);
  }
}

/** Read a single site_content value. Returns null if unset or unconfigured. */
export async function getContent(key: string): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const rows = await select<{ value: string | null }>(
      "site_content",
      `key=eq.${encodeURIComponent(key)}&select=value&limit=1`
    );
    return rows[0]?.value ?? null;
  } catch {
    // A missing photo should never take the public page down.
    return null;
  }
}

/**
 * Upload to Supabase Storage, overwriting whatever is at `path`.
 * Returns the public URL. The bucket must be created and set public.
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  body: ArrayBuffer,
  contentType: string
): Promise<string> {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      // Overwrite rather than error — only ever one current photo.
      "x-upsert": "true",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Supabase upload failed (${res.status}): ${await res.text()}`);
  }
  // Cache-bust so the new photo shows immediately.
  return `${url}/storage/v1/object/public/${bucket}/${path}?v=${Date.now()}`;
}
