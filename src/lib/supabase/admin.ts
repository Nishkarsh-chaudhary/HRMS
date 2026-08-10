import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { EmployeeDatabase } from "@/lib/employee-database";

/**
 * Service-role client. Bypasses RLS — only use in server-side code for
 * trusted operations (onboarding, invite handling, admin mutations).
 * Never expose to the client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local (server-only)."
    );
  }

  return createClient<EmployeeDatabase>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
