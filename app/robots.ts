import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://talentrank.io";

// ─────────────────────────────────────────────────────────────────────────────
// robots.txt — autorise tout, bloque les routes auth/admin et l'API.
// Pointe vers le sitemap pour aider Google à découvrir les URLs.
// ─────────────────────────────────────────────────────────────────────────────

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/sign-in",
          "/sign-up",
          "/dashboard/",
          "/messages/",
          "/onboarding",
          "/qcm-builder/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
