// delete-account: permanently deletes the signed-in caregiver's account.
//
// Only the server can delete a sign-in account (it needs the service-role key).
// Deleting the auth user removes everything else through the database's
// "on delete cascade" rules: caregiver row → takers → backups, invites,
// check-ins, sends; and push_tokens. Storage files aren't part of that (Storage
// won't let SQL delete files), so the profile photos are removed first.

import { admin, callerId, corsHeaders, json } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const userId = await callerId(req);
  if (!userId) return json({ error: "not_signed_in" }, 401);

  // 1. Profile photos (avatars/<user id>/…)
  const { data: files, error: listError } = await admin.storage.from("avatars").list(userId);
  if (listError) {
    console.error("Couldn't list photos:", listError.message);
    return json({ error: "server_error" }, 500);
  }
  if (files && files.length > 0) {
    const { error: removeError } = await admin.storage
      .from("avatars")
      .remove(files.map((f) => `${userId}/${f.name}`));
    if (removeError) {
      console.error("Couldn't delete photos:", removeError.message);
      return json({ error: "server_error" }, 500);
    }
  }

  // 2. The account itself; the rest goes with it
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Couldn't delete the account:", error.message);
    return json({ error: "server_error" }, 500);
  }

  console.log("Deleted an account and all its data");
  return json({ status: "deleted" });
});
