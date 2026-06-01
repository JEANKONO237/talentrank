"use client";

import { usePathname } from "next/navigation";
import { MainSidebar } from "./MainSidebar";
import { Footer } from "./Footer";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

// ─────────────────────────────────────────────────────────────────────────────
// RootShell — décide du chrome (sidebar + footer) selon la route.
//
//   - /welcome  → plein écran, pas de sidebar, pas de footer
//                  (le user n'a pas encore choisi son univers ; lui imposer
//                   une nav serait du bruit)
//   - tout le reste → sidebar + footer comme avant
//
// Ce composant est CLIENT parce qu'il consomme usePathname(). Le RootLayout
// reste server-side ; on isole juste cette décision conditionnelle ici.
//
// Ne pas confondre avec AppShell qui gère le layout INTERNE des dashboards
// (main + right rail). RootShell gère le chrome GLOBAL de l'app.
// ─────────────────────────────────────────────────────────────────────────────

const NO_CHROME_ROUTES = ["/welcome", "/onboarding"];

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = NO_CHROME_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (hideChrome) {
    return (
      <>
        {/* Skip-to-content link — audit Anya. Invisible jusqu'au focus
            clavier, permet aux users keyboard/screen-reader de bypasser le
            chrome répétitif et aller direct au contenu principal. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-night-700 focus:text-white focus:px-4 focus:py-2 focus:text-[12px] focus:font-bold focus:shadow-card focus:ring-2 focus:ring-cyan-400"
        >
          Aller au contenu principal
        </a>
        <main id="main-content" className="relative min-h-screen">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-night-700 focus:text-white focus:px-4 focus:py-2 focus:text-[12px] focus:font-bold focus:shadow-card focus:ring-2 focus:ring-cyan-400"
      >
        Aller au contenu principal
      </a>
      <MainSidebar />
      <div className="pl-[88px] lg:pl-[256px]">
        <main id="main-content" className="relative">
          {children}
        </main>
        <Footer />
      </div>
      <FeedbackWidget />
    </>
  );
}
