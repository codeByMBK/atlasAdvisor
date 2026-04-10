import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export function SharedHeader(): React.ReactElement {
  const location = useLocation();
  const isAppRoute = location.pathname === "/analyse" || location.pathname === "/metrics";
  const activeTab = location.pathname === "/metrics" ? "metrics" : "analyse";
  const [menuOpen, setMenuOpen] = useState(false);

  // Read initial theme from the class already on <html> (set by FOUC script or prior toggle)
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  // Keep state in sync when navigating between routes
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function toggleTheme(): void {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("atlasadvisor_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("atlasadvisor_theme", "light");
    }
  }

  return (
    <header className="sticky top-0 backdrop-blur-md z-20 bg-white/85 dark:bg-slate-950/85 border-b border-black/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-16 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Logo — always links home */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src="/favicon.png"
              alt="AtlasAdvisor logo"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <div>
              <span className="font-bold text-[15px] leading-none text-black dark:text-white">
                AtlasAdvisor
              </span>
              <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5 hidden sm:block">
                MongoDB Performance Recommender
              </p>
            </div>
          </Link>

          {/* Center — context-aware nav */}
          <div className="hidden md:flex flex-1 justify-center">
            {isAppRoute ? (
              /* App tab switcher */
              <nav className="flex items-center gap-1 bg-black/5 dark:bg-slate-800 rounded-lg p-1">
                {(["analyse", "metrics"] as const).map((tab) => (
                  <Link
                    key={tab}
                    to={`/${tab}`}
                    aria-current={activeTab === tab ? "page" : undefined}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? "bg-white dark:bg-slate-950 text-black dark:text-white shadow-sm"
                        : "text-black/50 dark:text-slate-400 hover:text-black dark:hover:text-slate-200"
                    }`}
                  >
                    {tab === "analyse" ? "⚡ Analyse" : "📊 Metrics"}
                  </Link>
                ))}
              </nav>
            ) : (
              /* Landing page nav links */
              <nav className="flex gap-6 font-medium text-sm text-black/60 dark:text-white/60 items-center">
                <a
                  href="#features"
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#stats"
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  Stats
                </a>
              </nav>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-md text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {isDark ? (
                /* Sun icon — click to go light */
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                /* Moon icon — click to go dark */
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* "Try It Free" CTA — only on landing */}
            {!isAppRoute && (
              <Link
                to="/analyse"
                className="btn btn-primary hidden md:inline-flex text-sm px-4 py-2"
              >
                Try It Free
              </Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="md:hidden p-2 rounded-md text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-1 border-t border-black/5 dark:border-white/5 flex flex-col gap-3">
            {isAppRoute ? (
              <>
                <Link
                  to="/analyse"
                  className={`text-sm font-medium py-1 ${activeTab === "analyse" ? "text-black dark:text-white" : "text-black/50 dark:text-slate-400"}`}
                >
                  ⚡ Analyse
                </Link>
                <Link
                  to="/metrics"
                  className={`text-sm font-medium py-1 ${activeTab === "metrics" ? "text-black dark:text-white" : "text-black/50 dark:text-slate-400"}`}
                >
                  📊 Metrics
                </Link>
                <Link
                  to="/"
                  className="text-sm font-medium py-1 text-black/40 dark:text-slate-500"
                >
                  ← Home
                </Link>
              </>
            ) : (
              <>
                <a href="#features" className="text-sm font-medium py-1 text-black/70 dark:text-white/70">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium py-1 text-black/70 dark:text-white/70">
                  How It Works
                </a>
                <a href="#stats" className="text-sm font-medium py-1 text-black/70 dark:text-white/70">
                  Stats
                </a>
                <Link to="/analyse" className="btn btn-primary text-sm w-fit mt-1">
                  Try It Free
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
