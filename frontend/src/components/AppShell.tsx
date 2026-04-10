import React from "react";
import { SharedHeader } from "./SharedHeader.js";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.ReactElement {
  return (
    <div className="relative min-h-screen text-black dark:text-white font-sans">
      {/* Full-page backdrop — theme-aware overlays so it works in light and dark */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <img
          src="/PrimaryImage.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center
            opacity-[0.10] dark:opacity-[0.28]
            sm:opacity-[0.12] dark:sm:opacity-[0.32]
            motion-reduce:opacity-[0.06] dark:motion-reduce:opacity-25"
        />
        {/* Light mode overlay: white wash so content stays readable */}
        <div className="absolute inset-0 bg-white/75 dark:bg-slate-950/60" />
        {/* Gradient fade to solid at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white dark:via-slate-950/40 dark:to-slate-950" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <SharedHeader />

        {/* Skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-20 focus:left-4 focus:z-50 focus:bg-brand-500 focus:text-slate-950 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-sm"
        >
          Skip to main content
        </a>

        <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-5 md:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
