import React from "react";
import { SharedHeader } from "../components/SharedHeader.js";
import { HeroSection } from "../sections/HeroSection.js";
import { LogoTicker } from "../sections/LogoTicker.js";
import { FeaturesShowcase } from "../sections/FeaturesShowcase.js";
import { HowItWorks } from "../sections/HowItWorks.js";
import { StatsSection } from "../sections/StatsSection.js";
import { CTASection } from "../sections/CTASection.js";
import { LandingFooter } from "../sections/LandingFooter.js";

export function LandingPage(): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-950 text-black dark:text-white font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-500 focus:text-slate-950 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>
      <SharedHeader />
      <main id="main-content">
        <HeroSection />
        <LogoTicker />
        <FeaturesShowcase />
        <HowItWorks />
        <StatsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
