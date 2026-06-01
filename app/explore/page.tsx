import { redirect } from "next/navigation";
import { PROFESSION_CATEGORIES } from "@/lib/professions";

// /explore was the old cross-profession search. We've replaced it with the
// strict per-profession model:
//   - /metiers           → all categories (catalogue)
//   - /metiers/[cat]     → professions in a category
//   - /ranking/[prof]    → the actual ranking, scoped to ONE profession
//
// If callers still hit /explore (links from old emails, bookmarks, the home
// category cards before they're updated), we forward them to /metiers,
// preserving the `category` query parameter when present so they land on the
// right sub-page.

export default async function ExploreRedirect({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const validCategory = PROFESSION_CATEGORIES.some((c) => c.id === sp.category);
  redirect(validCategory ? `/metiers/${sp.category}` : "/metiers");
}
