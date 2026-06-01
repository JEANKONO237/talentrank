"use client";

import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// AppShell — wraps signed-in surfaces (dashboards) to give them a centered
// main column + an optional right rail (stats, quests, league progression).
//
// The global sidebar (MainSidebar) lives in the root layout, so it's always
// visible. AppShell only handles the two right-hand columns.
// ─────────────────────────────────────────────────────────────────────────────

export interface AppShellProps {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
  variant?: "default" | "wide";
}

export function AppShell({ children, rightRail, variant = "default" }: AppShellProps) {
  return (
    <div className="relative min-h-screen flex">
      <main className="flex-1 min-w-0 flex justify-center">
        <div
          className={cn(
            "w-full px-5 sm:px-8 lg:px-10 py-8 lg:py-12",
            variant === "default" && "max-w-3xl",
          )}
        >
          {children}

          {/* Stacked rail — shown below main on < lg, hidden on lg+. */}
          {rightRail && (
            <div className="lg:hidden mt-10 space-y-4">{rightRail}</div>
          )}
        </div>
      </main>
      {rightRail && (
        <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-0 max-h-screen overflow-y-auto py-10 pr-6 xl:pr-8 pl-2 space-y-4">
          {rightRail}
        </aside>
      )}
    </div>
  );
}
