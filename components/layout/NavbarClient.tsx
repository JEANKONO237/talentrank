"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { t, type Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export interface NavbarUser {
  username: string;
  displayName: string;
  initials: string;
  gradient: string;
  role: "talent" | "studio" | "admin";
}

export function NavbarClient({ user, locale }: { user: NavbarUser | null; locale: Locale }) {
  const links = [
    { href: "/explore", label: t(locale, "nav.explore") },
    { href: "/chasse", label: locale === "fr" ? "Chasse" : "Hunt" },
    { href: "/ranking", label: t(locale, "nav.ranking") },
    { href: "/studios", label: t(locale, "nav.studios") },
    { href: "/pricing", label: t(locale, "nav.pricing") },
  ];
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const dashboardHref = user?.role === "studio" ? "/dashboard/recruiter" : "/dashboard/talent";

  // Hide the marketing navbar on signed-in product surfaces — the AppShell
  // sidebar takes over there.
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transition-all duration-300",
          scrolled
            ? "backdrop-blur-xl"
            : "backdrop-blur-md",
        )}
        style={{
          background: scrolled
            ? "linear-gradient(180deg, rgba(255,251,241,0.78), rgba(255,251,241,0.6))"
            : "linear-gradient(180deg, rgba(255,251,241,0.55), rgba(255,251,241,0.25))",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          boxShadow: scrolled
            ? "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 28px -24px rgba(0,0,0,0.35), 0 1px 2px -1px rgba(0,0,0,0.04)"
            : "0 1px 0 rgba(255,255,255,0.4) inset",
        }}
        aria-hidden
      />
      <nav className="container-page relative flex h-[56px] items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 -ml-1 px-1 py-0.5 rounded-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Logo size={28} />
        </Link>

        <ul
          className="hidden md:flex items-center gap-0.5 rounded-full p-0.5"
          style={{
            background: "rgba(255,255,255,0.55)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.05)",
          }}
        >
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <li key={l.href} className="relative">
                <Link
                  href={l.href}
                  className={cn(
                    "relative inline-flex h-8 items-center rounded-full px-3.5 font-display text-[13px] font-bold tracking-[-0.005em] transition-colors duration-200",
                    active
                      ? "text-ink-950"
                      : "text-mist-300 hover:text-mist-50",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-white shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_4px_12px_-4px_rgba(0,0,0,0.18)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{l.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:flex items-center gap-2">
          <LocaleSwitcher current={locale} />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="group inline-flex items-center gap-2 rounded-full bg-ink-850 hover:bg-ink-850 ring-1 ring-inset ring-ink-700/40 hover:ring-ink-700/50 pl-1 pr-3 py-1 transition"
              >
                <Avatar
                  initials={user.initials}
                  gradient={`bg-gradient-to-br ${user.gradient}`}
                  size="xs"
                />
                <span className="text-[13px] font-medium text-mist-100 max-w-[140px] truncate">
                  {user.displayName}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-panel p-2 ring-1 ring-inset ring-ink-700/40">
                  <Link
                    href={dashboardHref}
                    className="block rounded-lg px-3 py-2 text-[13px] text-mist-200 hover:bg-ink-850 hover:text-mist-50"
                  >
                    {t(locale, "nav.dashboard")}
                  </Link>
                  <Link
                    href="/messages"
                    className="block rounded-lg px-3 py-2 text-[13px] text-mist-200 hover:bg-ink-850 hover:text-mist-50"
                  >
                    Messages
                  </Link>
                  {user.role === "talent" && (
                    <>
                      <Link
                        href={`/talent/${user.username}`}
                        className="block rounded-lg px-3 py-2 text-[13px] text-mist-200 hover:bg-ink-850 hover:text-mist-50"
                      >
                        {t(locale, "nav.profile")}
                      </Link>
                      <Link
                        href="/dashboard/talent/profile"
                        className="block rounded-lg px-3 py-2 text-[13px] text-mist-200 hover:bg-ink-850 hover:text-mist-50"
                      >
                        {t(locale, "nav.edit")}
                      </Link>
                      <Link
                        href="/dashboard/talent/portfolio"
                        className="block rounded-lg px-3 py-2 text-[13px] text-mist-200 hover:bg-ink-850 hover:text-mist-50"
                      >
                        Portfolio
                      </Link>
                    </>
                  )}
                  <div className="my-1 h-px bg-ink-850" />
                  <form action="/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-mist-200 hover:bg-ink-850 hover:text-mist-50"
                    >
                      <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} />
                      {t(locale, "nav.signout")}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-[13px] font-medium text-mist-300 hover:text-mist-50 px-3 transition-colors"
              >
                {t(locale, "nav.signin")}
              </Link>
              <ButtonLink href="/sign-up" size="sm" variant="primary">
                {t(locale, "nav.join")}
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset ring-ink-700/40 bg-ink-900/70"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-ink-700/40 bg-ink-950/95 backdrop-blur-xl">
          <ul className="container-page py-4 grid gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block rounded-xl px-3 py-2.5 text-[14px] font-medium text-mist-200 hover:bg-ink-850"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                <li>
                  <Link
                    href={dashboardHref}
                    className="block rounded-xl px-3 py-2.5 text-[14px] font-medium text-mist-200 hover:bg-ink-850"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="pt-2">
                  <form action="/auth/signout" method="POST">
                    <Button type="submit" variant="glass" size="md" className="w-full">
                      Sign out
                    </Button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li className="pt-2">
                  <ButtonLink href="/sign-in" variant="glass" size="md" className="w-full">
                    Sign in
                  </ButtonLink>
                </li>
                <li className="pt-2">
                  <ButtonLink href="/sign-up" size="md" className="w-full">
                    Join as a talent
                  </ButtonLink>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
