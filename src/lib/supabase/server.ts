import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { required, supabaseAnonKey, supabaseUrl } from "@/lib/config";
export async function db() {
  const jar = await cookies();
  return createServerClient(
    supabaseUrl() || required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey() || required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server Components refresh through proxy. */
          }
        },
      },
    },
  );
}
