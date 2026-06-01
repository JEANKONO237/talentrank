import type { MetadataRoute } from "next";
import { getCities, citySlug, listCityProfessionPairs } from "@/lib/cities";
import { PROFESSIONS } from "@/lib/professions";
import { TALENTS } from "@/lib/mock-talents";

// ─────────────────────────────────────────────────────────────────────────────
// Sitemap dynamique — stratégie M-2.
//
// On expose à Google :
//   1. Pages canoniques (home, about, pricing, parrainage, ranking, villes,
//      métiers)
//   2. Une URL par métier : /ranking/[profession]
//   3. Une URL par ville : /villes/[city] (NB: actuellement /villes seulement
//      car on n'a pas encore de /villes/[city] standalone — TODO)
//   4. Une URL par combo (ville, métier) qui a ≥ 3 talents — la valeur SEO
//      est ici, ce sont les pages "Top Motion Designers à Lyon"
//   5. Une URL par profil talent : /talent/[slug]
//
// changefreq + priority sont des hints, Google les ignore en pratique mais
// on les met quand même pour la propreté.
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://talentrank.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  // 1. Canonical pages
  const canonical = [
    { path: "", priority: 1.0, changeFreq: "daily" as const },
    { path: "/welcome", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/about", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/pricing", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/parrainage", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/ranking", priority: 0.9, changeFreq: "daily" as const },
    { path: "/villes", priority: 0.9, changeFreq: "daily" as const },
    { path: "/metiers", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/talent", priority: 0.6, changeFreq: "weekly" as const },
    { path: "/studio", priority: 0.6, changeFreq: "weekly" as const },
    { path: "/embed", priority: 0.4, changeFreq: "monthly" as const },
  ];
  for (const c of canonical) {
    urls.push({
      url: `${SITE_URL}${c.path}`,
      lastModified: now,
      changeFrequency: c.changeFreq,
      priority: c.priority,
    });
  }

  // 2. Une URL par métier — chaque ranking métier est SEO-valuable
  for (const p of PROFESSIONS) {
    urls.push({
      url: `${SITE_URL}/ranking/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // 3. (placeholder) Une URL par ville — TODO : créer /villes/[city] standalone
  //    Pour l'instant on liste toutes les villes via /villes#anchor, Google
  //    ne les indexera pas séparément.

  // 4. Combos (ville × métier) avec ≥ 3 talents — le gros du SEO long-tail
  const pairs = listCityProfessionPairs(3);
  for (const pair of pairs) {
    urls.push({
      url: `${SITE_URL}/villes/${pair.citySlug}/${pair.professionId}`,
      lastModified: now,
      changeFrequency: "weekly",
      // Plus le combo a de talents, plus la page mérite d'être indexée
      priority: Math.min(0.85, 0.5 + Math.log(pair.count + 1) / 20),
    });
  }

  // 5. Profils talents — chaque profil est une vraie page indexable
  for (const t of TALENTS) {
    urls.push({
      url: `${SITE_URL}/talent/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return urls;
}

// Helper exposé pour compter ce qu'on indexe (utilisé par /presse à venir)
export function sitemapStats() {
  const pairs = listCityProfessionPairs(3);
  return {
    canonical: 11,
    professionRankings: PROFESSIONS.length,
    cityProfessionCombos: pairs.length,
    talentProfiles: TALENTS.length,
    totalCities: getCities().length,
    totalUrls:
      11 +
      PROFESSIONS.length +
      pairs.length +
      TALENTS.length,
  };
}

// Bonus : exposé pour debug
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _stats = sitemapStats;
