import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export function LandingHeader(): React.ReactElement {
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("atlasadvisor_theme");
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

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
    <header className="sticky top-0 backdrop-blur-sm z-20 bg-white/80 dark:bg-slate-950/80 border-b border-black/5 dark:border-white/5">
      <div className="py-4">
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/favicon.png" alt="AtlasAdvisor logo" className="w-9 h-9 rounded-lg object-cover" />
            <div className="hidden sm:block">
              <span className="font-bold text-base leading-none text-black dark:text-white">AtlasAdvisor</span>
              <p className="text-[10px] text-black/50 dark:text-white/50 mt-0.5">MongoDB Performance Recommender</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 font-medium text-black/70 dark:text-white/70 items-center text-sm">
            <a href="#features" className="hover:text-black dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black dark:hover:text-white transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-black dark:hover:text-white transition-colors">Stats</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Dark/light toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-md text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* CTA */}
            <Link
              to="/analyse"
              className="btn btn-primary hidden md:inline-flex text-sm px-4 py-2"
            >
              Try It Free
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-md text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden container mt-3 pb-3 border-t border-black/5 dark:border-white/5 pt-3 flex flex-col gap-3">
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-black/70 dark:text-white/70">Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-black/70 dark:text-white/70">How It Works</a>
            <a href="#stats" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-black/70 dark:text-white/70">Stats</a>
            <Link to="/analyse" className="btn btn-primary text-sm w-fit" onClick={() => setMenuOpen(false)}>Try It Free</Link>
          </div>
        )}
      </div>
    </header>
  );
}
