import { getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getLocale } from "@/lib/i18n/server";
import { NavbarClient, type NavbarUser } from "./NavbarClient";

export async function Navbar() {
  let user: NavbarUser | null = null;
  if (isSupabaseConfigured) {
    const profile = await getCurrentProfile();
    if (profile) {
      user = {
        username: profile.username,
        displayName: profile.display_name,
        initials: profile.avatar_initials,
        gradient: profile.avatar_gradient,
        role: profile.role,
      };
    }
  }
  const locale = await getLocale();
  return <NavbarClient user={user} locale={locale} />;
}
