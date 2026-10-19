import { FunctionsHttpError } from "@supabase/supabase-js";

import { forgetLoadedActivity } from "@/hooks/use-taker-activity";
import { forgetOnDelete } from "@/lib/preferences";
import { supabase } from "@/lib/supabase";

/**
 * Permanently deletes the signed-in caregiver's account and everything in it
 * (the delete-account Edge Function), then signs out on this phone.
 */
export async function deleteAccount(): Promise<{ ok: true } | { ok: false; problem: "offline" | "failed" }> {
  const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
  if (error) {
    console.warn("Couldn't delete the account", error);
    return { ok: false, problem: error instanceof FunctionsHttpError ? "failed" : "offline" };
  }
  // The account is gone on the server; forget it on this phone too
  await supabase.auth.signOut({ scope: "local" });
  forgetOnDelete();
  forgetLoadedActivity();
  return { ok: true };
}
