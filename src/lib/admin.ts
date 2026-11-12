import { useAccount } from "@/lib/auth-state";
import { supabase } from "@/integrations/supabase/client";

/** True when the signed-in user has the admin role (checked in the database). UI hint only — RLS is the real guard. */
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return !error && data === true;
}

export function useIsAdmin() {
  return useAccount().isAdmin;
}

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
