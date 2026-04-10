import React from "react";
import { Link } from "react-router-dom";

export function LandingFooter(): React.ReactElement {
  return (
    <footer className="bg-black text-[#BCBCBC] text-sm py-10 text-center">
      <div className="container">
        {/* Logo with glow effect */}
        <div className="inline-flex relative before:content-[''] before:bottom-0 before:top-1 before:h-full before:w-full before:blur before:bg-[linear-gradient(to_right,#00ED64,#183EC2,#00ED64)] before:absolute">
          <img
            src="/favicon.png"
            alt="AtlasAdvisor"
            className="w-10 h-10 rounded-lg object-cover relative"
          />
        </div>

        <p className="mt-3 font-semibold text-white text-sm">AtlasAdvisor</p>
        <p className="text-[#BCBCBC]/60 text-xs mt-0.5">MongoDB Performance Recommender</p>

        <nav className="flex flex-col md:flex-row items-center justify-center gap-6 mt-6">
          <Link to="/analyse" className="hover:text-white transition-colors">Analyse</Link>
          <Link to="/metrics" className="hover:text-white transition-colors">Metrics</Link>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a
            href="https://www.mongodb.com/docs/manual/indexes/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            MongoDB Docs
          </a>
        </nav>

        <p className="mt-8 text-[#BCBCBC]/50 text-xs">
          &copy; {new Date().getFullYear()} AtlasAdvisor. Built for the MongoDB community.
        </p>
      </div>
    </footer>
  );
}
