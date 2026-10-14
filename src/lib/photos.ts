import { supabase } from "@/lib/supabase";

/**
 * Profile photos, in the private "avatars" Storage bucket. Each caregiver has
 * a folder named after their account id; caregivers.photo_path says which
 * file is the current photo. Photos are shown through short-lived links.
 */

const BUCKET = "avatars";
/** How long a photo link works; the app makes a fresh one before it runs out */
export const PHOTO_LINK_SECONDS = 60 * 60;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export type PhotoProblem = "unsupported" | "offline" | "failed";

/** A temporary link to show a stored photo, or null */
export async function photoLink(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, PHOTO_LINK_SECONDS);
  if (error) {
    console.warn("Couldn't make a photo link", error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Saves a new profile photo (base64 from the image picker) and makes it the
 * current one. The old photo is deleted only after the new one is saved, so a
 * failed upload never leaves you without a photo.
 */
export async function saveProfilePhoto(
  userId: string,
  photo: { base64: string; mimeType: string },
  previousPath: string | null,
): Promise<{ ok: true; path: string; link: string | null } | { ok: false; problem: PhotoProblem }> {
  const extension = EXTENSIONS[photo.mimeType];
  if (!extension) return { ok: false, problem: "unsupported" };

  // base64 text → the photo's bytes
  const bytes = Uint8Array.from(atob(photo.base64), (c) => c.charCodeAt(0));
  const path = `${userId}/photo-${Date.now()}.${extension}`;

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes.buffer, { contentType: photo.mimeType, upsert: false });
  if (upload.error) {
    console.warn("Couldn't upload the photo", upload.error);
    return { ok: false, problem: problemFrom(upload.error) };
  }

  const saved = await supabase.from("caregivers").update({ photo_path: path }).eq("id", userId);
  if (saved.error) {
    console.warn("Couldn't save the photo on the profile", saved.error);
    await supabase.storage.from(BUCKET).remove([path]); // don't leave an unused file behind
    return { ok: false, problem: saved.error.code ? "failed" : "offline" };
  }

  if (previousPath && previousPath !== path) {
    const removed = await supabase.storage.from(BUCKET).remove([previousPath]);
    if (removed.error) console.warn("Couldn't delete the old photo", removed.error);
  }

  return { ok: true, path, link: await photoLink(path) };
}

/** "Remove photo": back to the initial letter */
export async function removeProfilePhoto(
  userId: string,
  path: string | null,
): Promise<{ ok: true } | { ok: false; problem: PhotoProblem }> {
  const saved = await supabase.from("caregivers").update({ photo_path: null }).eq("id", userId);
  if (saved.error) return { ok: false, problem: saved.error.code ? "failed" : "offline" };
  if (path) {
    const removed = await supabase.storage.from(BUCKET).remove([path]);
    if (removed.error) console.warn("Couldn't delete the photo file", removed.error);
  }
  return { ok: true };
}

/** supabase-js storage errors don't carry a code; a network failure says so */
function problemFrom(error: { message?: string }): PhotoProblem {
  return /network|fetch/i.test(error.message ?? "") ? "offline" : "failed";
}
